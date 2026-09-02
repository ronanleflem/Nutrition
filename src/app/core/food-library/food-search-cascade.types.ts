import type { FoodRepoSearchHit } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchHit } from '../off-api/off-search.types';
import type { UsdaSearchHit } from '../usda-fdc/usda-search.types';
import type { CatalogSearchHit } from './ingredient-picker-search.types';
import type { FoodSearchHit } from './food-search.types';

export type OnlineSearchHit = OffSearchHit | FoodRepoSearchHit | UsdaSearchHit;

export type FoodSearchCascadeHit = CatalogSearchHit | FoodSearchHit | OnlineSearchHit;

export type FoodSearchCascadeSource =
  | CatalogSearchHit['source']
  | FoodSearchHit['source']
  | OnlineSearchHit['source'];

export interface FoodSearchCascadeSection {
  source: FoodSearchCascadeSource;
  sourceLabel: string;
  hits: FoodSearchCascadeHit[];
}

export interface FoodSearchCascadeResult {
  sections: FoodSearchCascadeSection[];
  durationMs: number;
  offStatus?: 'ok' | 'skipped' | 'rate_limited' | 'network_error';
  offMsUntilRetry?: number;
  foodRepoStatus?: 'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error';
  usdaStatus?: 'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error';
  onlineSearched: boolean;
}

export const ONLINE_CASCADE_SOURCES = ['off', 'foodrepo', 'usda'] as const;

export type OnlineCascadeSource = (typeof ONLINE_CASCADE_SOURCES)[number];

export function isOnlineCascadeSource(source: FoodSearchCascadeSource): source is OnlineCascadeSource {
  return (ONLINE_CASCADE_SOURCES as readonly string[]).includes(source);
}
