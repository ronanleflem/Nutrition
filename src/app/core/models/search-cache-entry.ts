import type { FoodRepoSearchHit } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchHit } from '../off-api/off-search.types';
import type { UsdaSearchHit } from '../usda-fdc/usda-search.types';

export type SearchCacheSource = 'off' | 'foodrepo' | 'usda';

export type SearchCacheHitPayload = OffSearchHit | FoodRepoSearchHit | UsdaSearchHit;

export interface SearchCacheEntry {
  id: string;
  source: SearchCacheSource;
  queryNormalized: string;
  displayName: string;
  cachedAt: string;
  hit: SearchCacheHitPayload;
}
