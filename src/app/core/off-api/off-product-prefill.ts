export interface OffProductPrefill {
  barcode: string;
  label: string;
  brand?: string;
  suggestedProductName?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g?: number;
  saltPer100g?: number;
  ingredients?: string;
  imageUrl?: string;
}

export type OffLookupResult =
  | { status: 'found'; prefill: OffProductPrefill }
  | { status: 'not_found'; barcode: string }
  | { status: 'network_error'; barcode: string };
