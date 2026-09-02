import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { mapFoodRepoProduct } from './foodrepo-product-mapper';
import {
  FOODREPO_API_ORIGIN,
  FOODREPO_SEARCH_PATH,
} from './foodrepo-search-origin';
import {
  FOODREPO_SEARCH_SOURCE_LABEL,
  type FoodRepoSearchHit,
  type FoodRepoSearchProviderResult,
} from './foodrepo-search.types';

const MIN_QUERY_LENGTH = 3;
const SEARCH_TIMEOUT_MS = 5_000;
const DEFAULT_PAGE_SIZE = 20;

interface FoodRepoSearchApiHit {
  _source?: Record<string, unknown>;
}

interface FoodRepoSearchApiResponse {
  hits?: {
    hits?: FoodRepoSearchApiHit[];
  };
}

@Injectable({ providedIn: 'root' })
export class FoodRepoSearchProvider {
  private readonly database = inject(DatabaseService);
  private readonly sessionCache = new Map<string, FoodRepoSearchProviderResult>();

  async search(query: string, options?: { limit?: number }): Promise<FoodRepoSearchProviderResult> {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { status: 'skipped', hits: [] };
    }

    const settings = await this.database.getAppSettings();
    const apiKey = settings.foodRepoApiKey?.trim();
    if (!apiKey) {
      return { status: 'no_api_key', hits: [] };
    }

    const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
    const cacheKey = `${apiKey}:${trimmed.toLowerCase()}:${limit}`;
    const cached = this.sessionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

      const response = await fetch(`${FOODREPO_API_ORIGIN}${FOODREPO_SEARCH_PATH}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Token token="${apiKey}"`,
        },
        body: JSON.stringify(buildSearchBody(trimmed, limit)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        const result: FoodRepoSearchProviderResult = { status: 'unauthorized', hits: [] };
        this.sessionCache.set(cacheKey, result);
        return result;
      }

      if (!response.ok) {
        const result: FoodRepoSearchProviderResult = { status: 'network_error', hits: [] };
        this.sessionCache.set(cacheKey, result);
        return result;
      }

      const payload = (await response.json()) as FoodRepoSearchApiResponse;
      const hits = mapSearchHits(payload.hits?.hits ?? []);
      const result: FoodRepoSearchProviderResult = { status: 'ok', hits };
      this.sessionCache.set(cacheKey, result);
      return result;
    } catch {
      const result: FoodRepoSearchProviderResult = { status: 'network_error', hits: [] };
      this.sessionCache.set(cacheKey, result);
      return result;
    }
  }

  clearSessionCache(): void {
    this.sessionCache.clear();
  }
}

function buildSearchBody(query: string, size: number): Record<string, unknown> {
  return {
    size,
    query: {
      multi_match: {
        query,
        fields: ['name_translations.fr^2', 'display_name_translations.fr', 'barcode'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    },
    _source: [
      'id',
      'barcode',
      'name_translations',
      'display_name_translations',
      'ingredients_translations',
      'nutrients',
    ],
  };
}

function mapSearchHits(rawHits: FoodRepoSearchApiHit[]): FoodRepoSearchHit[] {
  const hits: FoodRepoSearchHit[] = [];

  for (const raw of rawHits) {
    const mapped = mapFoodRepoProduct((raw._source ?? {}) as Parameters<typeof mapFoodRepoProduct>[0]);
    if (!mapped) {
      continue;
    }

    hits.push({
      source: 'foodrepo',
      sourceLabel: FOODREPO_SEARCH_SOURCE_LABEL,
      ...mapped,
    });
  }

  return hits;
}
