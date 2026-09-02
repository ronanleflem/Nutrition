import type { OffProductPrefill } from '../off-api/off-product-prefill';

interface FoodRepoTranslations {
  fr?: string;
  en?: string;
  de?: string;
  [key: string]: string | undefined;
}

interface FoodRepoNutrient {
  per_hundred?: number;
}

interface FoodRepoProductSource {
  id?: number;
  barcode?: string;
  name_translations?: FoodRepoTranslations;
  display_name_translations?: FoodRepoTranslations;
  ingredients_translations?: FoodRepoTranslations;
  nutrients?: Record<string, FoodRepoNutrient | undefined>;
}

export function mapFoodRepoProduct(product: FoodRepoProductSource): FoodRepoSearchHitFields | null {
  const displayName = pickTranslation(product.display_name_translations, product.name_translations);
  if (!displayName) {
    return null;
  }

  const barcode = product.barcode?.trim() || undefined;
  const label = displayName;
  const brand = extractBrand(label);
  const ingredients = pickTranslation(product.ingredients_translations);
  const nutrients = product.nutrients ?? {};

  const prefill: OffProductPrefill = {
    barcode: barcode ?? '',
    label,
    brand,
    suggestedProductName: deriveGenericProductName(label, brand),
    kcalPer100g: readNutrient(nutrients, 'energy_kcal'),
    proteinPer100g: readNutrient(nutrients, 'proteins'),
    fatPer100g: readNutrient(nutrients, 'fat'),
    carbsPer100g: readNutrient(nutrients, 'carbohydrates'),
    fiberPer100g: readOptionalNutrient(nutrients, 'fiber'),
    saltPer100g: readOptionalNutrient(nutrients, 'salt'),
    ingredients,
  };

  return {
    id: barcode ? `foodrepo:${barcode}` : `foodrepo:${product.id ?? label}`,
    barcode,
    displayName: label,
    subtitle: brand,
    kcal: prefill.kcalPer100g,
    proteinG: prefill.proteinPer100g,
    fatG: prefill.fatPer100g,
    carbsG: prefill.carbsPer100g,
    fiberG: prefill.fiberPer100g ?? 0,
    prefill,
  };
}

export interface FoodRepoSearchHitFields {
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

function pickTranslation(...sources: Array<FoodRepoTranslations | undefined>): string | undefined {
  for (const source of sources) {
    const french = source?.fr?.trim();
    if (french) {
      return french;
    }
  }

  for (const source of sources) {
    const english = source?.en?.trim();
    if (english) {
      return english;
    }
  }

  for (const source of sources) {
    for (const value of Object.values(source ?? {})) {
      const trimmed = value?.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function extractBrand(label: string): string | undefined {
  const match = label.match(/^([^,-–—]+?)\s[-–—]/);
  return match?.[1]?.trim() || undefined;
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

function readNutrient(
  nutrients: Record<string, FoodRepoNutrient | undefined>,
  key: string,
): number {
  const value = nutrients[key]?.per_hundred;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readOptionalNutrient(
  nutrients: Record<string, FoodRepoNutrient | undefined>,
  key: string,
): number | undefined {
  const value = nutrients[key]?.per_hundred;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
