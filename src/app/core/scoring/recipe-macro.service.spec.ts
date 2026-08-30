import { describe, expect, it } from 'vitest';

import {
  calculateVariantMacros,
  macrosPerPortion,
  scaleMacrosPerQuantity,
  sumIngredientMacros,
} from '../models/recipe-macros';

const sampleMacros = {
  kcalPer100g: 100,
  proteinPer100g: 10,
  fatPer100g: 5,
  carbsPer100g: 12,
  fiberPer100g: 2,
};

describe('recipe macros', () => {
  it('scales macros by quantity', () => {
    const result = scaleMacrosPerQuantity(sampleMacros, 150);

    expect(result.kcal).toBe(150);
    expect(result.proteinG).toBe(15);
    expect(result.fatG).toBe(7.5);
    expect(result.carbsG).toBe(18);
    expect(result.fiberG).toBe(3);
  });

  it('sums ingredient macros for a variant', () => {
    const result = sumIngredientMacros([
      { quantityG: 100, macrosPer100g: sampleMacros },
      { quantityG: 50, macrosPer100g: { ...sampleMacros, kcalPer100g: 200, proteinPer100g: 20 } },
    ]);

    expect(result.total.kcal).toBe(200);
    expect(result.total.proteinG).toBe(20);
    expect(result.incomplete).toBe(false);
  });

  it('marks breakdown incomplete when an ingredient lacks macros', () => {
    const result = calculateVariantMacros(
      [
        { quantityG: 100, macrosPer100g: sampleMacros },
        { quantityG: 50 },
      ],
      2,
    );

    expect(result.incomplete).toBe(true);
    expect(result.total.kcal).toBe(100);
    expect(result.perPortion.kcal).toBe(50);
  });

  it('computes per-portion macros from total', () => {
    const perPortion = macrosPerPortion(
      {
        kcal: 400,
        proteinG: 32,
        fatG: 16,
        carbsG: 40,
        fiberG: 8,
      },
      4,
    );

    expect(perPortion.kcal).toBe(100);
    expect(perPortion.proteinG).toBe(8);
  });

  it('treats missing fiber as zero', () => {
    const result = scaleMacrosPerQuantity(
      {
        kcalPer100g: 80,
        proteinPer100g: 8,
        fatPer100g: 2,
        carbsPer100g: 10,
      },
      100,
    );

    expect(result.fiberG).toBe(0);
  });
});
