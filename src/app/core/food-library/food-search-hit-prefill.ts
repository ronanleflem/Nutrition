import type { OffProductPrefill } from '../off-api/off-product-prefill';
import type { FoodSearchHit } from './food-search.types';

/** Maps an offline library hit to scan/reference form prefill. */
export function foodSearchHitToPrefill(hit: FoodSearchHit, barcode: string): OffProductPrefill {
  if (hit.source === 'opennutrition' && hit.openNutritionEntry) {
    const entry = hit.openNutritionEntry;
    return {
      barcode,
      label: entry.brand ? `${entry.name} — ${entry.brand}` : entry.name,
      brand: entry.brand,
      suggestedProductName: entry.name,
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    };
  }

  return {
    barcode,
    label: hit.displayName,
    suggestedProductName: hit.displayName,
    kcalPer100g: hit.kcal,
    proteinPer100g: hit.proteinG,
    fatPer100g: hit.fatG,
    carbsPer100g: hit.carbsG,
    fiberPer100g: hit.fiberG,
  };
}
