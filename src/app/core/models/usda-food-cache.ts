export interface UsdaFoodCacheEntry {
  fdcId: number;
  description: string;
  brand?: string;
  dataType?: string;
  gtinUpc?: string;
  ingredients?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g?: number;
  cachedAt: string;
}
