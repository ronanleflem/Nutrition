import type { AppSettings } from '../models/app-settings';
import type { MacroGoals } from '../models/macro-goals';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';
import { isActiveProductReference, normalizeStoredBarcode } from '../models/product-reference';

export function normalizeMergeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function productNameBrandKey(name: string, brand?: string): string {
  return `${normalizeMergeKey(name)}|${normalizeMergeKey(brand ?? '')}`;
}

export function buildActiveBarcodeIndex(
  references: ProductReference[],
): Map<string, ProductReference> {
  const index = new Map<string, ProductReference>();

  for (const reference of references) {
    if (!isActiveProductReference(reference)) {
      continue;
    }

    const barcode = normalizeStoredBarcode(reference.barcode);
    if (barcode && !index.has(barcode)) {
      index.set(barcode, reference);
    }
  }

  return index;
}

export function buildNameBrandIndex(
  products: Product[],
  references: ProductReference[],
): Map<string, string> {
  const refsByProduct = new Map<string, ProductReference[]>();

  for (const reference of references) {
    if (!isActiveProductReference(reference)) {
      continue;
    }

    const existing = refsByProduct.get(reference.productId) ?? [];
    existing.push(reference);
    refsByProduct.set(reference.productId, existing);
  }

  const index = new Map<string, string>();

  for (const product of products) {
    if (product.deletedAt != null) {
      continue;
    }

    const productRefs = refsByProduct.get(product.id) ?? [];
    const keys = new Set<string>([productNameBrandKey(product.name)]);

    for (const reference of productRefs) {
      keys.add(productNameBrandKey(product.name, reference.brand));
    }

    for (const key of keys) {
      if (!index.has(key)) {
        index.set(key, product.id);
      }
    }
  }

  return index;
}

export function collectImportedProductKeys(
  product: Product,
  references: ProductReference[],
): string[] {
  const keys = new Set<string>([productNameBrandKey(product.name)]);

  for (const reference of references) {
    if (reference.productId !== product.id) {
      continue;
    }

    keys.add(productNameBrandKey(product.name, reference.brand));
  }

  return [...keys];
}

export function mergeMacroGoals(local: MacroGoals, imported: MacroGoals): MacroGoals {
  return {
    id: local.id,
    kcal: imported.kcal ?? local.kcal,
    proteinG: imported.proteinG ?? local.proteinG,
    fatG: imported.fatG ?? local.fatG,
    carbsG: imported.carbsG ?? local.carbsG,
    fiberG: imported.fiberG ?? local.fiberG,
  };
}

export function mergeLastExportAt(local?: string, imported?: string): string | undefined {
  if (!local) {
    return imported;
  }

  if (!imported) {
    return local;
  }

  return local >= imported ? local : imported;
}

export function pickImportedAppSettings(settings: AppSettings[]): AppSettings | undefined {
  return settings.find((entry) => entry.id === 'singleton') ?? settings[0];
}

export function pickImportedMacroGoals(goals: MacroGoals[]): MacroGoals | undefined {
  return goals.find((entry) => entry.id === 'singleton') ?? goals[0];
}
