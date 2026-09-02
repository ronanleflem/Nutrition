import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import {
  USDA_FDC_API_ORIGIN,
  USDA_FDC_DEFAULT_DATA_TYPES,
  USDA_FDC_SEARCH_PATH,
} from './usda-fdc-origin';
import { mapUsdaFood, type UsdaFoodSource } from './usda-food-mapper';
import { loadFrEnFoodAliases, translateUsdaSearchQuery } from './usda-query-translate';
import {
  USDA_SEARCH_SOURCE_LABEL,
  type UsdaSearchHit,
  type UsdaSearchProviderResult,
} from './usda-search.types';

const MIN_QUERY_LENGTH = 3;
const SEARCH_TIMEOUT_MS = 5_000;
const DEFAULT_PAGE_SIZE = 20;
const FR_EN_ALIASES_PATH = '/assets/food-library/fr-en-food-aliases.json';

interface UsdaSearchApiResponse {
  foods?: UsdaFoodSource[];
}

@Injectable({ providedIn: 'root' })
export class UsdaFdcSearchProvider {
  private readonly database = inject(DatabaseService);
  private readonly sessionCache = new Map<string, UsdaSearchProviderResult>();
  private aliasesPromise: ReturnType<typeof loadFrEnFoodAliases> | null = null;

  async search(query: string, options?: { limit?: number }): Promise<UsdaSearchProviderResult> {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { status: 'skipped', hits: [] };
    }

    const settings = await this.database.getAppSettings();
    const apiKey = settings.usdaApiKey?.trim();
    if (!apiKey) {
      return { status: 'no_api_key', hits: [] };
    }

    const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
    const cacheKey = `${apiKey}:${trimmed.toLowerCase()}:${limit}`;
    const cached = this.sessionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const aliases = await this.loadAliases();
    const translatedQuery = translateUsdaSearchQuery(trimmed, aliases);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

      const url = new URL(`${USDA_FDC_API_ORIGIN}${USDA_FDC_SEARCH_PATH}`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('query', translatedQuery);
      url.searchParams.set('pageSize', String(limit));
      for (const dataType of USDA_FDC_DEFAULT_DATA_TYPES) {
        url.searchParams.append('dataType', dataType);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        const result: UsdaSearchProviderResult = { status: 'unauthorized', hits: [] };
        this.sessionCache.set(cacheKey, result);
        return result;
      }

      if (!response.ok) {
        const result: UsdaSearchProviderResult = { status: 'network_error', hits: [] };
        this.sessionCache.set(cacheKey, result);
        return result;
      }

      const payload = (await response.json()) as UsdaSearchApiResponse;
      const hits = mapSearchHits(payload.foods ?? []);
      const result: UsdaSearchProviderResult = { status: 'ok', hits };
      this.sessionCache.set(cacheKey, result);
      return result;
    } catch {
      const result: UsdaSearchProviderResult = { status: 'network_error', hits: [] };
      this.sessionCache.set(cacheKey, result);
      return result;
    }
  }

  clearSessionCache(): void {
    this.sessionCache.clear();
  }

  private loadAliases(): ReturnType<typeof loadFrEnFoodAliases> {
    if (!this.aliasesPromise) {
      this.aliasesPromise = loadFrEnFoodAliases(FR_EN_ALIASES_PATH);
    }

    return this.aliasesPromise;
  }
}

function mapSearchHits(rawFoods: UsdaFoodSource[]): UsdaSearchHit[] {
  const hits: UsdaSearchHit[] = [];

  for (const raw of rawFoods) {
    const mapped = mapUsdaFood(raw);
    if (!mapped) {
      continue;
    }

    hits.push({
      source: 'usda',
      sourceLabel: USDA_SEARCH_SOURCE_LABEL,
      ...mapped,
    });
  }

  return hits;
}
