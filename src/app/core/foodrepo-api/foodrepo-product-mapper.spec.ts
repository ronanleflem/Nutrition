import { describe, expect, it } from 'vitest';

import { mapFoodRepoProduct } from './foodrepo-product-mapper';

describe('mapFoodRepoProduct', () => {
  it('maps French product fields and nutrients per 100 g', () => {
    const mapped = mapFoodRepoProduct({
      id: 123,
      barcode: '7613034623804',
      display_name_translations: { fr: 'Toblerone Lait' },
      ingredients_translations: { fr: 'Sucre, cacao' },
      nutrients: {
        energy_kcal: { per_hundred: 530 },
        proteins: { per_hundred: 6.2 },
        fat: { per_hundred: 30 },
        carbohydrates: { per_hundred: 58 },
        fiber: { per_hundred: 2.1 },
      },
    });

    expect(mapped).toMatchObject({
      barcode: '7613034623804',
      displayName: 'Toblerone Lait',
      kcal: 530,
      proteinG: 6.2,
      prefill: {
        barcode: '7613034623804',
        label: 'Toblerone Lait',
        kcalPer100g: 530,
        ingredients: 'Sucre, cacao',
      },
    });
  });

  it('returns null when no display name is available', () => {
    expect(mapFoodRepoProduct({ barcode: '123' })).toBeNull();
  });
});
