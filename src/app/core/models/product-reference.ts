import { normalizeBarcodeInput } from '../barcode/ean';

import type { Store } from './store';

export interface ProductReferenceMacros {
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g?: number;
  saltPer100g?: number;
}

export interface ProductReference extends ProductReferenceMacros {
  id: string;
  productId: string;
  store: Store;
  brand?: string;
  label: string;
  barcode?: string;
  ingredients?: string;
  price?: number;
  pricePerKg?: number;
  nutritionalScore: number;
  verdictLabel?: string;
  notes?: string;
  deletedAt?: string | null;
  thumbBlobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductReferenceInput extends ProductReferenceMacros {
  productId: string;
  store: Store;
  label: string;
  brand?: string;
  barcode?: string;
  ingredients?: string;
  price?: number;
  pricePerKg?: number;
  notes?: string;
}

export interface UpdateProductReferenceInput extends ProductReferenceMacros {
  store: Store;
  label: string;
  brand?: string;
  barcode?: string;
  ingredients?: string;
  price?: number;
  pricePerKg?: number;
  notes?: string;
}

export function createProductReference(
  input: CreateProductReferenceInput,
  nutritionalScore: number,
): ProductReference {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    productId: input.productId,
    store: input.store,
    label: input.label.trim(),
    brand: input.brand?.trim() || undefined,
    barcode: normalizeStoredBarcode(input.barcode),
    kcalPer100g: input.kcalPer100g,
    proteinPer100g: input.proteinPer100g,
    fatPer100g: input.fatPer100g,
    carbsPer100g: input.carbsPer100g,
    fiberPer100g: input.fiberPer100g,
    saltPer100g: input.saltPer100g,
    ingredients: input.ingredients?.trim() || undefined,
    price: input.price,
    pricePerKg: input.pricePerKg,
    nutritionalScore,
    notes: input.notes?.trim() || undefined,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isActiveProductReference(reference: ProductReference): boolean {
  return reference.deletedAt == null;
}

export function compareReferencesByScore(referenceA: ProductReference, referenceB: ProductReference): number {
  if (referenceB.nutritionalScore !== referenceA.nutritionalScore) {
    return referenceB.nutritionalScore - referenceA.nutritionalScore;
  }

  return referenceA.label.localeCompare(referenceB.label, 'fr', { sensitivity: 'base' });
}

export function deriveRecommendedStores(references: ProductReference[]): Store[] {
  const seen = new Set<Store>();
  const stores: Store[] = [];

  for (const reference of [...references].filter(isActiveProductReference).sort(compareReferencesByScore)) {
    if (!seen.has(reference.store)) {
      seen.add(reference.store);
      stores.push(reference.store);
    }
  }

  return stores;
}

export function normalizeStoredBarcode(barcode: string | undefined): string | undefined {
  if (!barcode?.trim()) {
    return undefined;
  }

  const normalized = normalizeBarcodeInput(barcode);
  return normalized || undefined;
}

export function formatMacrosSummary(reference: ProductReferenceMacros): string {
  const fiber = reference.fiberPer100g != null ? ` · ${reference.fiberPer100g} g fibres` : '';
  return `${reference.kcalPer100g} kcal · ${reference.proteinPer100g} g P · ${reference.fatPer100g} g L · ${reference.carbsPer100g} g G / 100 g${fiber}`;
}
