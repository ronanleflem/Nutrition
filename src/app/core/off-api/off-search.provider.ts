import { Injectable } from '@angular/core';

import { mapOffProductFields, type OffProductFields } from './off-product-mapper';
import { OFF_SEARCH_ORIGIN } from './off-search-origin';
import { OffSearchRateLimiter } from './off-search-rate-limiter';
import {
  OFF_SEARCH_SOURCE_LABEL,
  type OffSearchHit,
  type OffSearchProviderResult,
} from './off-search.types';

const MIN_QUERY_LENGTH = 3;
const SEARCH_TIMEOUT_MS = 5_000;
const DEFAULT_PAGE_SIZE = 20;

interface OffSearchApiHit extends OffProductFields {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  nutriments?: OffProductFields['nutriments'];
}

interface OffSearchApiResponse {
  hits?: OffSearchApiHit[];
}

@Injectable({ providedIn: 'root' })
export class OffSearchProvider {
  private readonly rateLimiter = new OffSearchRateLimiter();
  private readonly sessionCache = new Map<string, OffSearchProviderResult>();

  async search(
    query: string,
    options?: { limit?: number; abortSignal?: AbortSignal },
  ): Promise<OffSearchProviderResult> {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { status: 'skipped', hits: [] };
    }

    const cacheKey = `${trimmed.toLowerCase()}:${options?.limit ?? DEFAULT_PAGE_SIZE}`;
    const cached = this.sessionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.rateLimiter.canRequest()) {
      return {
        status: 'rate_limited',
        hits: [],
        msUntilRetry: this.rateLimiter.msUntilNextSlot(),
      };
    }

    try {
      const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
      const url = new URL(`${OFF_SEARCH_ORIGIN}/search`);
      url.searchParams.set('q', trimmed);
      url.searchParams.set('langs', 'fr');
      url.searchParams.set('page_size', String(limit));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
      options?.abortSignal?.addEventListener('abort', () => controller.abort(), { once: true });
      if (options?.abortSignal?.aborted) {
        clearTimeout(timeoutId);
        return { status: 'skipped', hits: [] };
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        return {
          status: 'rate_limited',
          hits: [],
          msUntilRetry: this.rateLimiter.msUntilNextSlot(),
        };
      }

      if (!response.ok) {
        return { status: 'network_error', hits: [] };
      }

      this.rateLimiter.recordRequest();

      const payload = (await response.json()) as OffSearchApiResponse;
      const hits = mapSearchHits(payload.hits ?? []);
      const result: OffSearchProviderResult = { status: 'ok', hits };
      this.sessionCache.set(cacheKey, result);
      return result;
    } catch {
      if (options?.abortSignal?.aborted) {
        return { status: 'skipped', hits: [] };
      }

      return { status: 'network_error', hits: [] };
    }
  }

  clearSessionCache(): void {
    this.sessionCache.clear();
    this.rateLimiter.reset();
  }
}

function mapSearchHits(rawHits: OffSearchApiHit[]): OffSearchHit[] {
  const hits: OffSearchHit[] = [];

  for (const raw of rawHits) {
    const barcode = raw.code?.trim() ?? '';
    const prefill = mapOffProductFields(barcode, raw);
    const hitId = barcode ? `off:${barcode}` : `off:name:${prefill.label.toLowerCase().replace(/\s+/g, '-')}`;

    hits.push({
      source: 'off',
      sourceLabel: OFF_SEARCH_SOURCE_LABEL,
      id: hitId,
      barcode,
      displayName: prefill.label,
      subtitle: prefill.brand,
      kcal: prefill.kcalPer100g,
      proteinG: prefill.proteinPer100g,
      fatG: prefill.fatPer100g,
      carbsG: prefill.carbsPer100g,
      fiberG: prefill.fiberPer100g ?? 0,
      prefill,
    });
  }

  return hits;
}
