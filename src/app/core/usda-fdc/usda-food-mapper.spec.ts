import { describe, expect, it } from 'vitest';

import { mapUsdaFood } from './usda-food-mapper';

describe('mapUsdaFood', () => {
  it('maps USDA nutrients per 100 g to app macros', () => {
    const mapped = mapUsdaFood({
      fdcId: 173944,
      description: 'Egg, whole, raw, fresh',
      dataType: 'SR Legacy',
      foodNutrients: [
        { nutrientNumber: '208', value: 143 },
        { nutrientNumber: '203', value: 12.6 },
        { nutrientNumber: '204', value: 9.5 },
        { nutrientNumber: '205', value: 0.7 },
        { nutrientNumber: '291', value: 0 },
      ],
    });

    expect(mapped).toMatchObject({
      id: 'usda:173944',
      fdcId: 173944,
      displayName: 'Egg, whole, raw, fresh',
      kcal: 143,
      proteinG: 12.6,
      fatG: 9.5,
      carbsG: 0.7,
      fiberG: 0,
      prefill: {
        label: 'Egg, whole, raw, fresh',
        kcalPer100g: 143,
        proteinPer100g: 12.6,
      },
      cacheEntry: {
        fdcId: 173944,
        description: 'Egg, whole, raw, fresh',
        kcalPer100g: 143,
      },
    });
  });

  it('scales branded per-serving nutrients to per 100 g', () => {
    const mapped = mapUsdaFood({
      fdcId: 123456,
      description: 'Brand Yogurt',
      brandOwner: 'Acme',
      dataType: 'Branded',
      servingSize: 170,
      servingSizeUnit: 'g',
      gtinUpc: '012345678901',
      foodNutrients: [
        { nutrientNumber: '208', value: 80, derivationCode: 'LCCS' },
        { nutrientNumber: '203', value: 10, derivationCode: 'LCCS' },
      ],
    });

    expect(mapped?.kcal).toBeCloseTo(47.1, 1);
    expect(mapped?.proteinG).toBeCloseTo(5.9, 1);
    expect(mapped?.prefill.barcode).toBe('012345678901');
  });

  it('returns null when fdcId or description is missing', () => {
    expect(mapUsdaFood({ description: 'Egg' })).toBeNull();
    expect(mapUsdaFood({ fdcId: 1 })).toBeNull();
  });
});
