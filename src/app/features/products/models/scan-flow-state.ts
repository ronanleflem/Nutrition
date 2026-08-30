import type { OffProductPrefill } from '../../../core/off-api/off-product-prefill';

export type ScanFlowStatus = 'off-found' | 'off-unknown' | 'offline' | 'network-error' | 'manual';

export interface ScanFlowState {
  barcode: string;
  status: ScanFlowStatus;
  prefill?: OffProductPrefill;
}
