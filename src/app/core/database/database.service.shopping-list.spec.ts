import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { createProduct } from '../models/product';
import { createProductReference } from '../models/product-reference';
import { NUTRITION_DB_NAME } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService shopping list', () => {
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

  async function seedProductWithPreferredReference(
    name: string,
    stores: string[] = ['carrefour'],
  ): Promise<string> {
    await service.createProduct({ name });
    const created = (await service.listActiveProducts()).find((item) => item.name === name);
    if (!created) {
      throw new Error('Product not created');
    }

    for (const store of stores) {
      await service.createProductReference({
        productId: created.id,
        store: store as 'carrefour',
        label: `${name} ${store}`,
        kcalPer100g: 100,
        proteinPer100g: 10,
        fatPer100g: 5,
        carbsPer100g: 12,
      });
    }

    const refs = await service.listActiveReferencesByProductId(created.id);
    await service.setPreferredReference(created.id, refs[0].id);
    return created.id;
  }

  async function createRecipeWithIngredients(
    title: string,
    ingredients: Array<{ productId: string; quantityG: number }>,
    variantName = 'Classique',
  ): Promise<string> {
    const result = await service.createRecipeWithFirstVariant({
      recipe: {
        title,
        steps: ['Préparer'],
        defaultPortions: 2,
      },
      variantName,
      ingredients,
    });

    return result.recipe.id;
  }

  it('generates auto items from plan minus pantry', async () => {
    const chickenId = await seedProductWithPreferredReference('Poulet');
    const riceId = await seedProductWithPreferredReference('Riz', ['auchan', 'leclerc']);
    const recipeId = await createRecipeWithIngredients('Bowl', [
      { productId: chickenId, quantityG: 200 },
      { productId: riceId, quantityG: 100 },
    ]);

    await service.addPantryItem({ productId: chickenId, quantityG: 50 });
    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId,
    });

    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');
    const items = await service.listShoppingListItemsWithProducts();

    expect(generated).toHaveLength(2);
    expect(items).toHaveLength(2);

    const chicken = items.find((item) => item.productId === chickenId);
    const rice = items.find((item) => item.productId === riceId);

    expect(chicken?.quantityG).toBe(150);
    expect(chicken?.source).toBe('auto');
    expect(chicken?.checked).toBe(false);
    expect(rice?.quantityG).toBe(100);
    expect(rice?.recommendedStores).toEqual(['auchan', 'leclerc']);
  });

  it('excludes products fully covered by pantry', async () => {
    const productId = await seedProductWithPreferredReference('Yaourt');
    const recipeId = await createRecipeWithIngredients('Snack', [{ productId, quantityG: 120 }]);

    await service.addPantryItem({ productId, quantityG: 200 });
    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'breakfast',
      recipeId,
    });

    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');

    expect(generated).toHaveLength(0);
    expect(await service.listShoppingListItemsWithProducts()).toHaveLength(0);
  });

  it('aggregates the same product across multiple meals', async () => {
    const productId = await seedProductWithPreferredReference('Tomate');
    const recipeId = await createRecipeWithIngredients('Salade', [{ productId, quantityG: 80 }]);

    await service.createMealPlanEntry({ date: '2026-08-31', slot: 'lunch', recipeId });
    await service.createMealPlanEntry({ date: '2026-08-31', slot: 'dinner', recipeId });

    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');

    expect(generated).toHaveLength(1);
    expect(generated[0].quantityG).toBe(160);
  });

  it('returns empty list when plan is empty', async () => {
    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-09-06');

    expect(generated).toHaveLength(0);
    expect(await service.listShoppingListItemsWithProducts()).toHaveLength(0);
  });

  it('uses default variant when recipeVariantId is null', async () => {
    const productId = await seedProductWithPreferredReference('Pâtes');
    const recipeResult = await service.createRecipeWithFirstVariant({
      recipe: {
        title: 'Pâtes',
        steps: ['Cuire'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId, quantityG: 90 }],
    });

    await service.addRecipeVariant({
      recipeId: recipeResult.recipe.id,
      name: 'Complète',
      ingredients: [{ productId, quantityG: 300 }],
    });

    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'dinner',
      recipeId: recipeResult.recipe.id,
    });

    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');

    expect(generated).toHaveLength(1);
    expect(generated[0].quantityG).toBe(90);
  });

  it('uses explicit variant when recipeVariantId is set', async () => {
    const productId = await seedProductWithPreferredReference('Saumon');
    const recipeResult = await service.createRecipeWithFirstVariant({
      recipe: {
        title: 'Saumon',
        steps: ['Cuire'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId, quantityG: 100 }],
    });

    const altVariant = await service.addRecipeVariant({
      recipeId: recipeResult.recipe.id,
      name: 'XL',
      ingredients: [{ productId, quantityG: 250 }],
    });

    const entry = await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId: recipeResult.recipe.id,
    });

    await service.updateMealPlanEntryVariant(entry.id, altVariant.variantId);

    const generated = await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');

    expect(generated).toHaveLength(1);
    expect(generated[0].quantityG).toBe(250);
  });

  it('replaces previous auto items on regeneration', async () => {
    const productId = await seedProductWithPreferredReference('Oeufs');
    const recipeId = await createRecipeWithIngredients('Omelette', [{ productId, quantityG: 120 }]);

    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'breakfast',
      recipeId,
    });

    await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');
    await service.addPantryItem({ productId, quantityG: 40 });
    await service.generateShoppingListForDateRange('2026-08-31', '2026-08-31');

    const items = await service.listShoppingListItemsWithProducts();

    expect(items).toHaveLength(1);
    expect(items[0].quantityG).toBe(80);
    expect(items.filter((item) => item.source === 'auto')).toHaveLength(1);
  });
});
