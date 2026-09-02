import type { OffProductPrefill } from '../../../core/off-api/off-product-prefill';

export type ScanFlowStatus =
  | 'off-found'
  | 'foodrepo-found'
  | 'usda-found'
  | 'off-unknown'
  | 'offline'
  | 'offline-library-found'
  | 'network-error'
  | 'manual';

export type OnlineSearchPrefillSource = 'off' | 'foodrepo' | 'usda';

export interface ScanFlowState {
  barcode: string;
  status: ScanFlowStatus;
  prefill?: OffProductPrefill;
}
