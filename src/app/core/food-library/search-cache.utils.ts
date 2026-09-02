import type { FoodRepoSearchHit } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchHit } from '../off-api/off-search.types';
import type { UsdaSearchHit } from '../usda-fdc/usda-search.types';
import type { SearchCacheEntry, SearchCacheHitPayload } from '../models/search-cache-entry';
import type { OnlineSearchHit } from './food-search-cascade.types';
import { matchesFoodSearchQuery, normalizeFoodSearchText } from './normalize-food-search';

export interface CachedOnlineHitsBySource {
  off: OffSearchHit[];
  foodrepo: FoodRepoSearchHit[];
  usda: UsdaSearchHit[];
}

export function groupEntriesBySource(
  entries: SearchCacheEntry[],
  limitPerSection: number,
): CachedOnlineHitsBySource {
  const off: OffSearchHit[] = [];
  const foodrepo: FoodRepoSearchHit[] = [];
  const usda: UsdaSearchHit[] = [];

  for (const entry of entries) {
    const hit = entry.hit;
    if (hit.source === 'off' && off.length < limitPerSection) {
      off.push(hit);
    } else if (hit.source === 'foodrepo' && foodrepo.length < limitPerSection) {
      foodrepo.push(hit);
    } else if (hit.source === 'usda' && usda.length < limitPerSection) {
      usda.push(hit);
    }
  }

  return { off, foodrepo, usda };
}

export function matchesSearchCacheQuery(entry: SearchCacheEntry, query: string): boolean {
  return (
    matchesFoodSearchQuery(normalizeFoodSearchText(entry.displayName), query) ||
    matchesFoodSearchQuery(entry.queryNormalized, query)
  );
}

export function toSearchCacheEntry(query: string, hit: SearchCacheHitPayload): SearchCacheEntry {
  return {
    id: hit.id,
    source: hit.source,
    queryNormalized: normalizeFoodSearchText(query),
    displayName: hit.displayName,
    cachedAt: new Date().toISOString(),
    hit,
  };
}

export function mergeOnlineHits<T extends OnlineSearchHit>(primary: T[], secondary: T[], limit: number): T[] {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const hit of [...primary, ...secondary]) {
    if (seen.has(hit.id) || merged.length >= limit) {
      continue;
    }

    seen.add(hit.id);
    merged.push(hit);
  }

  return merged;
}
