import type { OffProductPrefill } from '../off-api/off-product-prefill';
import type { UsdaFoodCacheEntry } from '../models/usda-food-cache';

interface UsdaFoodNutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
  derivationCode?: string;
}

export interface UsdaFoodSource {
  fdcId?: number;
  description?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
}

const PER_SERVING_DERIVATIONS = new Set(['LCCS', 'LCCD', 'LC']);

export function mapUsdaFood(source: UsdaFoodSource): UsdaSearchHitFields | null {
  const fdcId = source.fdcId;
  const description = source.description?.trim();
  if (fdcId == null || !description) {
    return null;
  }

  const brand = source.brandOwner?.trim() || source.brandName?.trim() || undefined;
  const barcode = source.gtinUpc?.trim() || undefined;
  const macros = mapMacrosPer100g(source);
  const label = description;
  const prefill: OffProductPrefill = {
    barcode: barcode ?? '',
    label,
    brand,
    suggestedProductName: deriveGenericProductName(label, brand),
    kcalPer100g: macros.kcal,
    proteinPer100g: macros.proteinG,
    fatPer100g: macros.fatG,
    carbsPer100g: macros.carbsG,
    fiberPer100g: macros.fiberG,
    ingredients: source.ingredients?.trim() || undefined,
  };

  const cacheEntry: UsdaFoodCacheEntry = {
    fdcId,
    description: label,
    brand,
    dataType: source.dataType,
    gtinUpc: barcode,
    ingredients: prefill.ingredients,
    kcalPer100g: macros.kcal,
    proteinPer100g: macros.proteinG,
    fatPer100g: macros.fatG,
    carbsPer100g: macros.carbsG,
    fiberPer100g: macros.fiberG,
    cachedAt: new Date().toISOString(),
  };

  return {
    id: `usda:${fdcId}`,
    fdcId,
    displayName: label,
    subtitle: brand,
    kcal: macros.kcal,
    proteinG: macros.proteinG,
    fatG: macros.fatG,
    carbsG: macros.carbsG,
    fiberG: macros.fiberG ?? 0,
    prefill,
    cacheEntry,
  };
}

export interface UsdaSearchHitFields {
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

function mapMacrosPer100g(source: UsdaFoodSource): {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG?: number;
} {
  const nutrients = source.foodNutrients ?? [];
  const servingScale = readServingScale(source);

  return {
    kcal: scaleNutrient(readNutrient(nutrients, '208', '1008'), servingScale, nutrients, '208', '1008'),
    proteinG: scaleNutrient(readNutrient(nutrients, '203', '1003'), servingScale, nutrients, '203', '1003'),
    fatG: scaleNutrient(readNutrient(nutrients, '204', '1004'), servingScale, nutrients, '204', '1004'),
    carbsG: scaleNutrient(readNutrient(nutrients, '205', '1005'), servingScale, nutrients, '205', '1005'),
    fiberG: scaleOptionalNutrient(
      readOptionalNutrient(nutrients, '291', '1079'),
      servingScale,
      nutrients,
      '291',
      '1079',
    ),
  };
}

function readServingScale(source: UsdaFoodSource): number {
  const servingSize = source.servingSize;
  const unit = source.servingSizeUnit?.toUpperCase();
  if (!servingSize || servingSize <= 0 || unit !== 'G' && unit !== 'GRM') {
    return 1;
  }

  return 100 / servingSize;
}

function scaleNutrient(
  value: number,
  servingScale: number,
  nutrients: UsdaFoodNutrient[],
  ...numbers: string[]
): number {
  if (value <= 0) {
    return 0;
  }

  if (servingScale === 1 || !isPerServing(nutrients, numbers)) {
    return roundMacro(value);
  }

  return roundMacro(value * servingScale);
}

function scaleOptionalNutrient(
  value: number | undefined,
  servingScale: number,
  nutrients: UsdaFoodNutrient[],
  ...numbers: string[]
): number | undefined {
  if (value == null) {
    return undefined;
  }

  return scaleNutrient(value, servingScale, nutrients, ...numbers);
}

function isPerServing(nutrients: UsdaFoodNutrient[], numbers: string[]): boolean {
  return nutrients.some(
    (nutrient) =>
      numbers.includes(nutrient.nutrientNumber ?? '') &&
      PER_SERVING_DERIVATIONS.has(nutrient.derivationCode ?? ''),
  );
}

function readNutrient(nutrients: UsdaFoodNutrient[], ...numbers: string[]): number {
  for (const number of numbers) {
    const nutrient = nutrients.find((entry) => entry.nutrientNumber === number);
    const value = nutrient?.value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function readOptionalNutrient(
  nutrients: UsdaFoodNutrient[],
  ...numbers: string[]
): number | undefined {
  for (const number of numbers) {
    const nutrient = nutrients.find((entry) => entry.nutrientNumber === number);
    const value = nutrient?.value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function deriveGenericProductName(label: string, brand?: string): string {
  if (!brand) {
    return label;
  }

  const withoutBrand = label.replace(new RegExp(`^${escapeRegExp(brand)}\\s*[-–—]?\\s*`, 'i'), '').trim();
  return withoutBrand || label;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}
