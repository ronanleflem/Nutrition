import type { OffProductPrefill } from './off-product-prefill';

export const OFF_SEARCH_SOURCE_LABEL = 'Open Food Facts';

export interface OffSearchHit {
  source: 'off';
  sourceLabel: typeof OFF_SEARCH_SOURCE_LABEL;
  id: string;
  barcode: string;
  displayName: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  prefill: OffProductPrefill;
}

export type OffSearchProviderStatus = 'ok' | 'skipped' | 'rate_limited' | 'network_error';

export interface OffSearchProviderResult {
  status: OffSearchProviderStatus;
  hits: OffSearchHit[];
  msUntilRetry?: number;
}
