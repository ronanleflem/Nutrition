import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { createProduct } from '../models/product';
import { createProductReference } from '../models/product-reference';
import { NUTRITION_DB_NAME } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService meal plan', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    await service.closeForTests();
    await deleteNutritionDatabase();
  });

  async function seedProductWithPreferredReference(name: string): Promise<string> {
    const product = createProduct({ name });
    await service.createProduct({ name: product.name });
    const created = (await service.listActiveProducts()).find((item) => item.name === name);
    if (!created) {
      throw new Error('Product not created');
    }

    const reference = createProductReference(
      {
        productId: created.id,
        store: 'carrefour',
        label: `${name} ref`,
        kcalPer100g: 100,
        proteinPer100g: 10,
        fatPer100g: 5,
        carbsPer100g: 12,
      },
      80,
    );

    await service.createProductReference({
      productId: created.id,
      store: 'carrefour',
      label: reference.label,
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 12,
    });

    const refs = await service.listActiveReferencesByProductId(created.id);
    await service.setPreferredReference(created.id, refs[0].id);
    return created.id;
  }

  async function createSampleRecipe(title = 'Wrap poulet'): Promise<string> {
    const productId = await seedProductWithPreferredReference('Poulet');
    const result = await service.createRecipeWithFirstVariant({
      recipe: {
        title,
        steps: ['Couper', 'Assembler'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId, quantityG: 150 }],
    });

    return result.recipe.id;
  }

  it('creates a meal plan entry without recipeVariantId', async () => {
    const recipeId = await createSampleRecipe();

    const entry = await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId,
    });

    expect(entry.recipeId).toBe(recipeId);
    expect(entry.recipeVariantId).toBeUndefined();
    expect(entry.date).toBe('2026-08-31');
    expect(entry.slot).toBe('lunch');
  });

  it('rejects duplicate date and slot', async () => {
    const recipeId = await createSampleRecipe();

    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId,
    });

    await expect(
      service.createMealPlanEntry({
        date: '2026-08-31',
        slot: 'lunch',
        recipeId,
      }),
    ).rejects.toThrow(/déjà planifié/i);
  });

  it('lists entries between dates', async () => {
    const recipeId = await createSampleRecipe();

    await service.createMealPlanEntry({ date: '2026-08-30', slot: 'breakfast', recipeId });
    await service.createMealPlanEntry({ date: '2026-08-31', slot: 'lunch', recipeId });
    await service.createMealPlanEntry({ date: '2026-09-01', slot: 'dinner', recipeId });

    const entries = await service.listMealPlanEntriesBetweenDates('2026-08-30', '2026-08-31');

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => `${entry.date}:${entry.slot}`)).toEqual([
      '2026-08-30:breakfast',
      '2026-08-31:lunch',
    ]);
  });

  it('gets entry by date and slot', async () => {
    const recipeId = await createSampleRecipe();
    const created = await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'dinner',
      recipeId,
    });

    const found = await service.getMealPlanEntryByDateAndSlot('2026-08-31', 'dinner');

    expect(found?.id).toBe(created.id);
  });

  it('updates recipe on an entry and clears variant', async () => {
    const firstRecipeId = await createSampleRecipe('Wrap poulet');
    const secondRecipeId = await createSampleRecipe('Bowl riz');

    const created = await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId: firstRecipeId,
    });

    const updated = await service.updateMealPlanEntry(created.id, {
      recipeId: secondRecipeId,
      recipeVariantId: null,
    });

    expect(updated.recipeId).toBe(secondRecipeId);
    expect(updated.recipeVariantId).toBeUndefined();
  });

  it('deletes a meal plan entry', async () => {
    const recipeId = await createSampleRecipe();
    const created = await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'breakfast',
      recipeId,
    });

    await service.deleteMealPlanEntry(created.id);

    expect(await service.getMealPlanEntryByDateAndSlot('2026-08-31', 'breakfast')).toBeUndefined();
  });

  it('rejects create for unknown recipe', async () => {
    await expect(
      service.createMealPlanEntry({
        date: '2026-08-31',
        slot: 'lunch',
        recipeId: 'missing-recipe',
      }),
    ).rejects.toThrow(/introuvable/i);
  });
});
