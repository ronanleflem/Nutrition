import type { CreateProductReferenceInput } from '../models/product-reference';
import type { CreateProductInput, Product } from '../models/product';
import type { ProductCatalogItem } from '../models/product-catalog';
import type { ProductReference } from '../models/product-reference';
import { productNameBrandKey } from '../backup/backup-merge';
import type { FoodSearchHit } from './food-search.types';

export const GENERIC_REFERENCE_LABEL = 'Générique';

export interface FoodLibraryImportReferenceInput
  extends Omit<CreateProductReferenceInput, 'productId'> {}

export interface FoodLibraryImportPlan {
  product: CreateProductInput;
  reference: FoodLibraryImportReferenceInput;
}

export type FoodLibraryDuplicateReason = 'source' | 'barcode' | 'name';

export interface FoodLibraryDuplicateMatch {
  reason: FoodLibraryDuplicateReason;
  existingProduct: Product;
  existingReference?: ProductReference;
  message: string;
}

export interface FoodLibraryImportCreated {
  status: 'created';
  product: Product;
  reference: ProductReference;
}

export interface FoodLibraryImportDuplicate {
  status: 'duplicate';
  match: FoodLibraryDuplicateMatch;
}

export type FoodLibraryImportResult = FoodLibraryImportCreated | FoodLibraryImportDuplicate;

export function buildImportPlanFromHit(hit: FoodSearchHit): FoodLibraryImportPlan {
  if (hit.source === 'ciqual') {
    const entry = hit.ciqualEntry;
    if (!entry) {
      throw new Error('Entrée Ciqual manquante pour l’import.');
    }

    return {
      product: {
        name: entry.nameFr,
        category: entry.category,
        sourceProvider: 'ciqual',
        sourceId: entry.id,
      },
      reference: {
        store: 'other',
        label: GENERIC_REFERENCE_LABEL,
        kcalPer100g: hit.kcal,
        proteinPer100g: hit.proteinG,
        fatPer100g: hit.fatG,
        carbsPer100g: hit.carbsG,
        fiberPer100g: hit.fiberG,
      },
    };
  }

  const entry = hit.openNutritionEntry;
  if (!entry) {
    throw new Error('Entrée OpenNutrition manquante pour l’import.');
  }

  return {
    product: {
      name: entry.name,
      sourceProvider: 'opennutrition',
      sourceId: entry.id,
    },
    reference: {
      store: 'other',
      label: entry.name,
      brand: entry.brand,
      barcode: entry.barcode,
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    },
  };
}

export function findFoodLibraryDuplicate(
  hit: FoodSearchHit,
  catalog: ProductCatalogItem[],
  barcodeMatch?: { product: Product; reference: ProductReference },
): FoodLibraryDuplicateMatch | null {
  const plan = buildImportPlanFromHit(hit);

  for (const item of catalog) {
    if (
      item.product.sourceProvider === plan.product.sourceProvider &&
      item.product.sourceId === plan.product.sourceId
    ) {
      return {
        reason: 'source',
        existingProduct: item.product,
        existingReference: item.preferredReference,
        message: `« ${item.product.name} » est déjà dans votre catalogue (même source ${hit.sourceLabel}).`,
      };
    }
  }

  if (barcodeMatch) {
    return {
      reason: 'barcode',
      existingProduct: barcodeMatch.product,
      existingReference: barcodeMatch.reference,
      message: `Un produit avec le code-barres ${hit.barcode} existe déjà : « ${barcodeMatch.product.name} ».`,
    };
  }

  const targetKeys = new Set<string>([
    productNameBrandKey(plan.product.name),
    productNameBrandKey(plan.product.name, plan.reference.brand),
  ]);

  for (const item of catalog) {
    const keys = new Set<string>([productNameBrandKey(item.product.name)]);
    if (item.preferredReference?.brand) {
      keys.add(productNameBrandKey(item.product.name, item.preferredReference.brand));
    }

    for (const key of keys) {
      if (targetKeys.has(key)) {
        return {
          reason: 'name',
          existingProduct: item.product,
          existingReference: item.preferredReference,
          message: `Un produit similaire existe déjà : « ${item.product.name} ».`,
        };
      }
    }
  }

  return null;
}
