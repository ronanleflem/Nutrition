import { describe, expect, it } from 'vitest';

import type { ProductCatalogItem } from '../models/product-catalog';
import { createProduct } from '../models/product';
import { createProductReference } from '../models/product-reference';
import {
  buildImportPlanFromHit,
  findFoodLibraryDuplicate,
  GENERIC_REFERENCE_LABEL,
} from './food-library-import';
import { toCiqualHit, toOpenNutritionHit } from './food-search-index';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from './food-search.fixtures';

describe('food-library-import', () => {
  const ciqualHit = toCiqualHit(CIQUAL_FIXTURE_CHUNK.entries[0]);
  const openNutritionHit = toOpenNutritionHit(OPENNUTRITION_FIXTURE_CHUNK.entries[0]);

  it('maps Ciqual hits to generic reference without barcode', () => {
    const plan = buildImportPlanFromHit(ciqualHit);

    expect(plan.product).toMatchObject({
      name: 'Œuf, cru',
      category: 'œufs de poule',
      sourceProvider: 'ciqual',
      sourceId: 'ciqual-9001',
    });
    expect(plan.reference).toMatchObject({
      label: GENERIC_REFERENCE_LABEL,
      kcalPer100g: 143,
    });
    expect(plan.reference.barcode).toBeUndefined();
  });

  it('maps OpenNutrition hits with barcode on reference', () => {
    const plan = buildImportPlanFromHit(openNutritionHit);

    expect(plan.product).toMatchObject({
      name: 'Skyr Nature',
      sourceProvider: 'opennutrition',
      sourceId: 'fd_test1',
    });
    expect(plan.reference).toMatchObject({
      label: 'Skyr Nature',
      brand: 'Danone',
      barcode: '3560070467394',
    });
  });

  it('detects duplicate by source id', () => {
    const product = createProduct({
      name: 'Œuf, cru',
      sourceProvider: 'ciqual',
      sourceId: 'ciqual-9001',
    });
    const catalog: ProductCatalogItem[] = [{ product, preferredReference: undefined }];

    const duplicate = findFoodLibraryDuplicate(ciqualHit, catalog);

    expect(duplicate?.reason).toBe('source');
    expect(duplicate?.existingProduct.id).toBe(product.id);
  });

  it('detects duplicate by barcode', () => {
    const product = createProduct({ name: 'Skyr existant' });
    const reference = createProductReference(
      {
        productId: product.id,
        store: 'other',
        label: 'Skyr',
        barcode: '3560070467394',
        kcalPer100g: 60,
        proteinPer100g: 10,
        fatPer100g: 0,
        carbsPer100g: 4,
      },
      80,
    );
    const catalog: ProductCatalogItem[] = [{ product, preferredReference: reference }];

    const duplicate = findFoodLibraryDuplicate(openNutritionHit, catalog, {
      product,
      reference,
    });

    expect(duplicate?.reason).toBe('barcode');
  });

  it('detects duplicate by normalized product name', () => {
    const product = createProduct({ name: 'Skyr Nature' });
    const catalog: ProductCatalogItem[] = [{ product, preferredReference: undefined }];

    const duplicate = findFoodLibraryDuplicate(openNutritionHit, catalog);

    expect(duplicate?.reason).toBe('name');
  });
});
