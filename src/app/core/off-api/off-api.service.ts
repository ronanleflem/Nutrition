import { Injectable } from '@angular/core';

import { OFF_API_ORIGIN } from '../pwa/off-api-origin';
import type { OffLookupResult, OffProductPrefill } from './off-product-prefill';

interface OffApiResponse {
  status: number;
  code: string;
  product?: {
    product_name?: string;
    product_name_fr?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_fr?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

@Injectable({ providedIn: 'root' })
export class OffApiService {
  private readonly sessionCache = new Map<string, OffLookupResult>();

  async lookupProduct(barcode: string): Promise<OffLookupResult> {
    const cached = this.sessionCache.get(barcode);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${OFF_API_ORIGIN}/api/v2/product/${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return { status: 'network_error', barcode };
      }

      const payload = (await response.json()) as OffApiResponse;
      if (payload.status !== 1 || !payload.product) {
        const result: OffLookupResult = { status: 'not_found', barcode };
        this.sessionCache.set(barcode, result);
        return result;
      }

      const prefill = mapOffProduct(barcode, payload.product);
      const result: OffLookupResult = { status: 'found', prefill };
      this.sessionCache.set(barcode, result);
      return result;
    } catch {
      return { status: 'network_error', barcode };
    }
  }

  clearSessionCache(): void {
    this.sessionCache.clear();
  }
}

function mapOffProduct(barcode: string, product: NonNullable<OffApiResponse['product']>): OffProductPrefill {
  const nutriments = product.nutriments ?? {};
  const label =
    pickFrenchOrDefault(product.product_name_fr, product.product_name) ?? `Produit ${barcode}`;
  const brand = product.brands?.split(',')[0]?.trim() || undefined;
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
  };
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

function readEnergyKcal(nutriments: Record<string, number | string | undefined>): number {
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

function readNutriment(
  nutriments: Record<string, number | string | undefined>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = toNumber(nutriments[key]);
    if (value != null) {
      return value;
    }
  }

  return 0;
}

function readOptionalNutriment(
  nutriments: Record<string, number | string | undefined>,
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
