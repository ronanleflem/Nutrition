import { Injectable, signal } from '@angular/core';

import type { ProductCatalogItem } from '../models/product-catalog';
import type { CiqualFoodLibraryChunk } from './ciqual-library.types';
import { FOOD_LIBRARY_CHUNK_PATHS } from './food-library-paths';
import { FoodSearchIndex } from './food-search-index';
import type { FoodSearchHit, FoodSearchLocalResult } from './food-search.types';
import {
  buildIngredientPickerSearchResult,
  searchCatalogForIngredientPicker,
} from './ingredient-picker-search';
import type { IngredientPickerSearchResult } from './ingredient-picker-search.types';
import type { OpenNutritionFoodLibraryChunk } from './opennutrition-library.types';

@Injectable({ providedIn: 'root' })
export class FoodSearchService {
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
    options?: { limitPerSection?: number },
  ): Promise<IngredientPickerSearchResult> {
    const limit = options?.limitPerSection ?? 25;
    const catalogStartedAt = performance.now();
    const catalogHits = searchCatalogForIngredientPicker(catalog, query, limit);
    const catalogDurationMs = performance.now() - catalogStartedAt;

    const libraryResult = await this.searchLocal(query, { limitPerSection: limit });

    return buildIngredientPickerSearchResult(catalogHits, libraryResult, catalogDurationMs);
  }

  private async loadLibraries(): Promise<void> {
    const [ciqualResponse, openNutritionResponse] = await Promise.all([
      fetch(FOOD_LIBRARY_CHUNK_PATHS.ciqual),
      fetch(FOOD_LIBRARY_CHUNK_PATHS.opennutrition),
    ]);

    if (!ciqualResponse.ok) {
      throw new Error(`Chunk Ciqual introuvable (${ciqualResponse.status}).`);
    }

    if (!openNutritionResponse.ok) {
      throw new Error(`Chunk OpenNutrition introuvable (${openNutritionResponse.status}).`);
    }

    const [ciqualChunk, openNutritionChunk] = await Promise.all([
      ciqualResponse.json() as Promise<CiqualFoodLibraryChunk>,
      openNutritionResponse.json() as Promise<OpenNutritionFoodLibraryChunk>,
    ]);

    this.index.load(ciqualChunk, openNutritionChunk);
    this.loaded.set(true);
  }
}
