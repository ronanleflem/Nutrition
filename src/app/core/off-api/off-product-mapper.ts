import type { OffProductPrefill } from './off-product-prefill';

export interface OffNutrimentsRecord {
  [key: string]: number | string | undefined;
}

export interface OffProductFields {
  product_name?: string;
  product_name_fr?: string;
  brands?: string | string[];
  ingredients_text?: string;
  ingredients_text_fr?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  image_small_url?: string;
  image_url?: string;
  nutriments?: OffNutrimentsRecord;
}

export const OFF_PRODUCT_THUMB_MAX_WIDTH = 288;

export function mapOffProductFields(barcode: string, product: OffProductFields): OffProductPrefill {
  const nutriments = product.nutriments ?? {};
  const label =
    pickFrenchOrDefault(product.product_name_fr, product.product_name) ?? `Produit ${barcode}`;
  const brand = readBrand(product.brands);
  const ingredients =
    pickFrenchOrDefault(product.ingredients_text_fr, product.ingredients_text) || undefined;

  return {
    barcode,
    label,
    brand,
    suggestedProductName: deriveGenericProductName(label, brand),
    kcalPer100g: readEnergyKcal(nutriments),
    proteinPer100g: readNutriment(nutriments, 'proteins_100g', 'proteins'),
    fatPer100g: readNutriment(nutriments, 'fat_100g', 'fat'),
    carbsPer100g: readNutriment(nutriments, 'carbohydrates_100g', 'carbohydrates'),
    fiberPer100g: readOptionalNutriment(nutriments, 'fiber_100g', 'fiber'),
    saltPer100g: readOptionalNutriment(nutriments, 'salt_100g', 'salt'),
    ingredients,
    imageUrl: readOffImageUrl(product),
  };
}

export function readOffImageUrl(product: OffProductFields): string | undefined {
  return (
    pickUrl(product.image_front_small_url) ??
    pickUrl(product.image_front_url) ??
    pickUrl(product.image_small_url) ??
    pickUrl(product.image_url)
  );
}

function pickUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function readBrand(brands: string | string[] | undefined): string | undefined {
  if (Array.isArray(brands)) {
    return brands[0]?.trim() || undefined;
  }

  return brands?.split(',')[0]?.trim() || undefined;
}

function deriveGenericProductName(label: string, brand?: string): string {
  if (!brand) {
    return label;
  }

  const withoutBrand = label.replace(new RegExp(`^${escapeRegExp(brand)}\\s*`, 'i'), '').trim();
  return withoutBrand || label;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickFrenchOrDefault(french?: string, fallback?: string): string | undefined {
  const value = french?.trim() || fallback?.trim();
  return value || undefined;
}

function readEnergyKcal(nutriments: OffNutrimentsRecord): number {
  const kcal = readNutriment(nutriments, 'energy-kcal_100g', 'energy-kcal');
  if (kcal > 0) {
    return kcal;
  }

  const kilojoules = readNutriment(nutriments, 'energy_100g', 'energy-kj_100g');
  if (kilojoules > 0) {
    return Math.round((kilojoules / 4.184) * 10) / 10;
  }

  return 0;
}

function readNutriment(nutriments: OffNutrimentsRecord, ...keys: string[]): number {
  for (const key of keys) {
    const value = toNumber(nutriments[key]);
    if (value != null) {
      return value;
    }
  }

  return 0;
}

function readOptionalNutriment(
  nutriments: OffNutrimentsRecord,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = toNumber(nutriments[key]);
    if (value != null) {
      return value;
    }
  }

  return undefined;
}

function toNumber(value: number | string | undefined): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
