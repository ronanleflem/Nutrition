import { inject, Injectable, signal } from '@angular/core';

import { NetworkStatusService } from '../network/network-status.service';
import { DatabaseService } from '../database/database.service';
import { FoodRepoSearchProvider } from '../foodrepo-api/foodrepo-search.provider';
import { OffSearchProvider } from '../off-api/off-search.provider';
import { UsdaFdcSearchProvider } from '../usda-fdc/usda-search.provider';
import type { ProductCatalogItem } from '../models/product-catalog';
import type { FoodLibraryPageSearchResult } from './food-library-search.types';
import { SearchCacheService } from './search-cache.service';
import {
  parseCiqualChunk,
  parseOpenNutritionChunk,
} from './food-library-chunk-validation';
import {
  FOOD_LIBRARY_MANIFEST_PATH,
  type FoodLibraryManifest,
  foodLibraryChunkPath,
} from './food-library-paths';
import {
  buildCascadeFromLocalAndOnline,
  buildCascadeFromLocalOnly,
} from './food-search-cascade';
import type { FoodSearchCascadeResult } from './food-search-cascade.types';
import { FoodSearchIndex } from './food-search-index';
import type { FoodSearchHit, FoodSearchLocalResult } from './food-search.types';
import {
  searchCatalogForIngredientPicker,
} from './ingredient-picker-search';
import type { IngredientPickerSearchResult } from './ingredient-picker-search.types';
import { probeOnlineProviderKeyStatuses } from './online-search-provider-utils';

export const FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH = 3;
export const FOOD_SEARCH_ONLINE_DEBOUNCE_MS = 400;

export interface FoodSearchCascadeOptions {
  limitPerSection?: number;
  includeOnline?: boolean;
  catalog?: ProductCatalogItem[];
  abortSignal?: AbortSignal;
}

@Injectable({ providedIn: 'root' })
export class FoodSearchService {
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly database = inject(DatabaseService);
  private readonly offSearch = inject(OffSearchProvider);
  private readonly foodRepoSearch = inject(FoodRepoSearchProvider);
  private readonly usdaSearch = inject(UsdaFdcSearchProvider);
  private readonly searchCache = inject(SearchCacheService);
  private readonly index = new FoodSearchIndex();
  private loadPromise: Promise<void> | null = null;

  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly loadError = signal<string | null>(null);

  async ensureLibrariesLoaded(): Promise<void> {
    if (this.loaded()) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.loadPromise = this.loadLibraries()
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Impossible de charger la bibliothèque alimentaire offline.';
        this.loadError.set(message);
        this.loadPromise = null;
        throw error;
      })
      .finally(() => {
        this.loading.set(false);
      });

    return this.loadPromise;
  }

  async searchCascade(
    query: string,
    options?: FoodSearchCascadeOptions,
  ): Promise<FoodSearchCascadeResult> {
    const limit = options?.limitPerSection ?? 25;
    const catalog = options?.catalog ?? [];
    const trimmed = query.trim();
    const catalogStartedAt = performance.now();
    const catalogHits = catalog.length > 0
      ? searchCatalogForIngredientPicker(catalog, query, limit)
      : [];
    const catalogDurationMs = performance.now() - catalogStartedAt;

    const localStartedAt = performance.now();
    const localResult = await this.searchLocal(query, { limitPerSection: limit });
    const localDurationMs = performance.now() - localStartedAt;

    const cachedOnline =
      trimmed.length >= FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH
        ? await this.searchCache.findMatchingHits(trimmed, limit)
        : { off: [], foodrepo: [], usda: [] };

    const shouldSearchOnline =
      options?.includeOnline === true &&
      this.networkStatus.isOnline() &&
      trimmed.length >= FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH;

    if (!shouldSearchOnline) {
      const keyStatuses = probeOnlineProviderKeyStatuses(await this.database.getAppSettings());

      return buildCascadeFromLocalAndOnline(
        catalogHits,
        localResult,
        catalogDurationMs + localDurationMs,
        { included: false, cached: cachedOnline },
        limit,
        keyStatuses,
      );
    }

    if (options?.abortSignal?.aborted) {
      return buildCascadeFromLocalAndOnline(
        catalogHits,
        localResult,
        catalogDurationMs + localDurationMs,
        { included: false, cached: cachedOnline },
        limit,
      );
    }

    const providerOptions = { limit, abortSignal: options?.abortSignal };
    const onlineStartedAt = performance.now();
    const [offResult, foodRepoResult, usdaResult] = await Promise.all([
      this.offSearch.search(query, providerOptions),
      this.foodRepoSearch.search(query, providerOptions),
      this.usdaSearch.search(query, providerOptions),
    ]);
    const onlineDurationMs = performance.now() - onlineStartedAt;

    if (!options?.abortSignal?.aborted) {
      try {
        await this.persistSuccessfulOnlineHits(trimmed, offResult, foodRepoResult, usdaResult);
      } catch {
        // Cache write failure must not block search results.
      }
    }

    return buildCascadeFromLocalAndOnline(
      catalogHits,
      localResult,
      catalogDurationMs + localDurationMs,
      {
        included: true,
        durationMs: onlineDurationMs,
        off: offResult,
        foodRepo: foodRepoResult,
        usda: usdaResult,
        cached: cachedOnline,
      },
      limit,
    );
  }

  private async persistSuccessfulOnlineHits(
    query: string,
    offResult: Awaited<ReturnType<OffSearchProvider['search']>>,
    foodRepoResult: Awaited<ReturnType<FoodRepoSearchProvider['search']>>,
    usdaResult: Awaited<ReturnType<UsdaFdcSearchProvider['search']>>,
  ): Promise<void> {
    const hits = [
      ...(offResult.status === 'ok' ? offResult.hits : []),
      ...(foodRepoResult.status === 'ok' ? foodRepoResult.hits : []),
      ...(usdaResult.status === 'ok' ? usdaResult.hits : []),
    ];

    if (hits.length > 0) {
      await this.searchCache.rememberSuccessfulHits(query, hits);
    }
  }

  async searchLibraryPage(
    query: string,
    options?: { limitPerSection?: number; includeOnline?: boolean },
  ): Promise<FoodLibraryPageSearchResult> {
    const result = await this.searchCascade(query, {
      limitPerSection: options?.limitPerSection,
      includeOnline: options?.includeOnline ?? this.networkStatus.isOnline(),
    });

    return {
      ...result,
      sections: result.sections.filter((section) => section.source !== 'catalog') as FoodLibraryPageSearchResult['sections'],
    };
  }

  async searchLocal(
    query: string,
    options?: { limitPerSection?: number },
  ): Promise<FoodSearchLocalResult> {
    await this.ensureLibrariesLoaded();

    const startedAt = performance.now();
    const sections = this.index.searchLocal(query, options?.limitPerSection);

    return {
      sections,
      durationMs: performance.now() - startedAt,
    };
  }

  async searchByBarcode(barcode: string): Promise<FoodSearchHit | null> {
    await this.ensureLibrariesLoaded();
    return this.index.searchByBarcode(barcode);
  }

  async searchForIngredientPicker(
    catalog: ProductCatalogItem[],
    query: string,
    options?: { limitPerSection?: number; includeOnline?: boolean },
  ): Promise<IngredientPickerSearchResult> {
    return this.searchCascade(query, {
      catalog,
      limitPerSection: options?.limitPerSection,
      includeOnline: options?.includeOnline ?? this.networkStatus.isOnline(),
    });
  }

  async getCiqualHitById(id: string): Promise<FoodSearchHit | null> {
    await this.ensureLibrariesLoaded();
    return this.index.getCiqualHitById(id);
  }

  private async loadLibraries(): Promise<void> {
    const manifestResponse = await fetch(FOOD_LIBRARY_MANIFEST_PATH);
    if (!manifestResponse.ok) {
      throw new Error(`Manifeste bibliothèque introuvable (${manifestResponse.status}).`);
    }

    const manifest = (await manifestResponse.json()) as FoodLibraryManifest;
    if (!manifest.ciqual?.trim() || !manifest.opennutrition?.trim()) {
      throw new Error('Manifeste bibliothèque invalide.');
    }

    const ciqualUrl = foodLibraryChunkPath(manifest.ciqual);
    const openNutritionUrl = foodLibraryChunkPath(manifest.opennutrition);

    const [ciqualResponse, openNutritionResponse] = await Promise.all([
      fetch(ciqualUrl),
      fetch(openNutritionUrl),
    ]);

    if (!ciqualResponse.ok) {
      throw new Error(`Chunk Ciqual introuvable (${ciqualResponse.status}).`);
    }

    if (!openNutritionResponse.ok) {
      throw new Error(`Chunk OpenNutrition introuvable (${openNutritionResponse.status}).`);
    }

    const [ciqualRaw, openNutritionRaw] = await Promise.all([
      ciqualResponse.json(),
      openNutritionResponse.json(),
    ]);

    const ciqualChunk = parseCiqualChunk(ciqualRaw);
    const openNutritionChunk = parseOpenNutritionChunk(openNutritionRaw);

    this.index.load(ciqualChunk, openNutritionChunk);
    this.loaded.set(true);
  }
}
