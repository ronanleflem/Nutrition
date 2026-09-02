import type { OffProductPrefill } from '../off-api/off-product-prefill';
import type { UsdaFoodCacheEntry } from '../models/usda-food-cache';

export const USDA_SEARCH_SOURCE_LABEL = 'USDA';

export interface UsdaSearchHit {
  source: 'usda';
  sourceLabel: typeof USDA_SEARCH_SOURCE_LABEL;
  id: string;
  fdcId: number;
  displayName: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  prefill: OffProductPrefill;
  cacheEntry: UsdaFoodCacheEntry;
}

export type UsdaSearchProviderStatus =
  | 'ok'
  | 'skipped'
  | 'no_api_key'
  | 'unauthorized'
  | 'network_error';

export interface UsdaSearchProviderResult {
  status: UsdaSearchProviderStatus;
  hits: UsdaSearchHit[];
}
