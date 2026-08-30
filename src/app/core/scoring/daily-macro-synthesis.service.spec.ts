import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { DatabaseService } from '../database/database.service';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { createProduct } from '../models/product';
import { DailyMacroSynthesisService } from './daily-macro-synthesis.service';

describe('DailyMacroSynthesisService', () => {
  let databaseService: DatabaseService;
  let service: DailyMacroSynthesisService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    databaseService = TestBed.inject(DatabaseService);
    service = TestBed.inject(DailyMacroSynthesisService);
  });

  afterEach(async () => {
    await databaseService.closeForTests();
    await deleteNutritionDatabase();
  });

  async function seedRecipeWithMacros(): Promise<{ recipeId: string; variantId: string }> {
    const product = createProduct({ name: 'Poulet' });
    await databaseService.createProduct({ name: product.name });
    const created = (await databaseService.listActiveProducts()).find((item) => item.name === 'Poulet');
    if (!created) {
      throw new Error('Product not created');
    }

    await databaseService.createProductReference({
      productId: created.id,
      store: 'carrefour',
      label: 'Poulet ref',
      kcalPer100g: 100,
      proteinPer100g: 20,
      fatPer100g: 5,
      carbsPer100g: 0,
      fiberPer100g: 0,
    });

    const refs = await databaseService.listActiveReferencesByProductId(created.id);
    await databaseService.setPreferredReference(created.id, refs[0].id);

    const result = await databaseService.createRecipeWithFirstVariant({
      recipe: {
        title: 'Wrap poulet',
        steps: ['Assembler'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId: created.id, quantityG: 200 }],
    });

    return { recipeId: result.recipe.id, variantId: result.variantId };
  }

  it('returns empty synthesis with neutral bars when no meals are planned', async () => {
    await databaseService.updateMacroGoals({ kcal: 2000, proteinG: 150 });

    const synthesis = await service.getDailySynthesis('2026-08-30');

    expect(synthesis.hasMeals).toBe(false);
    expect(synthesis.meals).toHaveLength(0);
    expect(synthesis.totals.kcal).toBe(0);
    expect(synthesis.bars).toHaveLength(5);
    expect(synthesis.bars[0].state).toBe('under');
    expect(synthesis.bars[0].fillPercent).toBe(0);
  });

  it('aggregates resolved variant macros for meal plan entries', async () => {
    const { recipeId } = await seedRecipeWithMacros();
    await databaseService.updateMacroGoals({ kcal: 500, proteinG: 50 });

    await databaseService.createMealPlanEntry({
      date: '2026-08-30',
      slot: 'lunch',
      recipeId,
    });

    const synthesis = await service.getDailySynthesis('2026-08-30');

    expect(synthesis.hasMeals).toBe(true);
    expect(synthesis.meals).toHaveLength(1);
    expect(synthesis.meals[0].slotLabel).toBe('Déjeuner');
    expect(synthesis.totals.kcal).toBe(100);
    expect(synthesis.totals.proteinG).toBe(20);
    expect(synthesis.bars[0].state).toBe('under');
    expect(synthesis.bars[0].valueLabel).toContain('100');
  });

  it('uses explicit recipeVariantId when provided', async () => {
    const { recipeId } = await seedRecipeWithMacros();
    const products = await databaseService.listActiveProducts();
    const variant = await databaseService.addRecipeVariant({
      recipeId,
      name: 'Light',
      ingredients: [{ productId: products[0].id, quantityG: 100 }],
    });

    await databaseService.createMealPlanEntry({
      date: '2026-08-30',
      slot: 'dinner',
      recipeId,
      recipeVariantId: variant.variantId,
    });

    const synthesis = await service.getDailySynthesis('2026-08-30');

    expect(synthesis.meals[0].variantName).toBe('Light');
  });
});
