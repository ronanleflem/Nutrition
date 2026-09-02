import type { FoodRepoSearchHit } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchHit } from '../off-api/off-search.types';
import type { FoodSearchHit, FoodSearchSection } from './food-search.types';

export type OnlineSearchHit = OffSearchHit | FoodRepoSearchHit;

export type FoodLibrarySearchHit = FoodSearchHit | OnlineSearchHit;

export interface FoodLibrarySearchSection {
  source: FoodSearchSection['source'] | OnlineSearchHit['source'];
  sourceLabel: string;
  hits: FoodLibrarySearchHit[];
}

export interface FoodLibraryPageSearchResult {
  sections: FoodLibrarySearchSection[];
  durationMs: number;
  offStatus?: 'ok' | 'skipped' | 'rate_limited' | 'network_error';
  offMsUntilRetry?: number;
  foodRepoStatus?: 'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error';
}

export function isOffSearchHit(hit: FoodLibrarySearchHit): hit is OffSearchHit {
  return hit.source === 'off';
}

export function isFoodRepoSearchHit(hit: FoodLibrarySearchHit): hit is FoodRepoSearchHit {
  return hit.source === 'foodrepo';
}

export function isOnlineSearchHit(hit: FoodLibrarySearchHit): hit is OnlineSearchHit {
  return hit.source === 'off' || hit.source === 'foodrepo';
}
