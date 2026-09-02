import type { OffProductPrefill } from '../off-api/off-product-prefill';

export const FOODREPO_SEARCH_SOURCE_LABEL = 'FoodRepo';

export interface FoodRepoSearchHit {
  source: 'foodrepo';
  sourceLabel: typeof FOODREPO_SEARCH_SOURCE_LABEL;
  id: string;
  barcode?: string;
  displayName: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  prefill: OffProductPrefill;
}

export type FoodRepoSearchProviderStatus =
  | 'ok'
  | 'skipped'
  | 'no_api_key'
  | 'unauthorized'
  | 'network_error';

export interface FoodRepoSearchProviderResult {
  status: FoodRepoSearchProviderStatus;
  hits: FoodRepoSearchHit[];
}
