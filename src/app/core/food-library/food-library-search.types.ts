import type { OffSearchHit } from '../off-api/off-search.types';
import type { FoodSearchHit, FoodSearchSection } from './food-search.types';

export type FoodLibrarySearchHit = FoodSearchHit | OffSearchHit;

export interface FoodLibrarySearchSection {
  source: FoodSearchSection['source'] | OffSearchHit['source'];
  sourceLabel: string;
  hits: FoodLibrarySearchHit[];
}

export interface FoodLibraryPageSearchResult {
  sections: FoodLibrarySearchSection[];
  durationMs: number;
  offStatus?: 'ok' | 'skipped' | 'rate_limited' | 'network_error';
  offMsUntilRetry?: number;
}

export function isOffSearchHit(hit: FoodLibrarySearchHit): hit is OffSearchHit {
  return hit.source === 'off';
}
