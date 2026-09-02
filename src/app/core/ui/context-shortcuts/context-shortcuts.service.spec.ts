import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../../database/nutrition-database';
import { deleteNutritionDatabase } from '../../database/nutrition-database.testing';
import { ShoppingListService } from '../../../features/shopping-list/services/shopping-list.service';
import { CONTEXT_SHORTCUT_MESSAGES } from './context-shortcuts.models';
import { ContextShortcutsService } from './context-shortcuts.service';

describe('ContextShortcutsService', () => {
  let service: ContextShortcutsService;
  let database: DatabaseService;
  let shopping: ShoppingListService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ContextShortcutsService);
    database = TestBed.inject(DatabaseService);
    shopping = TestBed.inject(ShoppingListService);
    await database.initialize();
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function seedProduct(name: string): Promise<string> {
    const product = await database.createProduct({ name });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: `${name} ref`,
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 4,
      carbsPer100g: 6,
    });
    await database.setPreferredReference(product.id, reference.id);
    return product.id;
  }

  async function seedRecipe(
    title: string,
    ingredients: Array<{ productId: string; quantityG: number }>,
  ): Promise<string> {
    const result = await database.createRecipeWithFirstVariant({
      recipe: { title, steps: ['Préparer.'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients,
    });
    return result.recipe.id;
  }

  it('opens pantry and shopping sheets for a product without changing other state', async () => {
    service.openMenu({ kind: 'product', productId: 'p1', productName: 'Skyr' });
    await service.handleMenuAction('pantry');
    expect(service.sheet()).toEqual({
      name: 'pantry',
      productId: 'p1',
      productName: 'Skyr',
    });

    service.openMenu({ kind: 'product', productId: 'p1', productName: 'Skyr' });
    await service.handleMenuAction('shopping');
    expect(service.sheet()?.name).toBe('shopping');
  });

  it('opens the pantry sheet prefilled when a recipe has one default ingredient', async () => {
    const productId = await seedProduct('Œuf');
    const recipeId = await seedRecipe('Omelette', [{ productId, quantityG: 120 }]);

    service.openMenu({ kind: 'recipe', recipeId, recipeTitle: 'Omelette' });
    await service.handleMenuAction('pantry');

    expect(service.sheet()).toEqual({
      name: 'pantry',
      productId,
      productName: 'Œuf',
      quantityG: 120,
    });
  });

  it('asks to pick an ingredient when a recipe has several default ingredients', async () => {
    const eggId = await seedProduct('Œuf');
    const butterId = await seedProduct('Beurre');
    const recipeId = await seedRecipe('Omelette', [
      { productId: eggId, quantityG: 120 },
      { productId: butterId, quantityG: 10 },
    ]);

    service.openMenu({ kind: 'recipe', recipeId, recipeTitle: 'Omelette' });
    await service.handleMenuAction('pantry');

    expect(service.sheet()?.name).toBe('pick-ingredient');
  });

  it('adds one manual shopping item per default-variant ingredient', async () => {
    const eggId = await seedProduct('Œuf');
    const butterId = await seedProduct('Beurre');
    const recipeId = await seedRecipe('Omelette', [
      { productId: eggId, quantityG: 120 },
      { productId: butterId, quantityG: 10 },
    ]);
    const refresh = vi.spyOn(shopping, 'refresh');

    service.openMenu({ kind: 'recipe', recipeId, recipeTitle: 'Omelette' });
    await service.handleMenuAction('shopping');

    const items = await database.listShoppingListItemsWithProducts();
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.productId === eggId)?.quantityG).toBe(120);
    expect(items.find((item) => item.productId === butterId)?.quantityG).toBe(10);
    expect(service.confirmation()).toBe(CONTEXT_SHORTCUT_MESSAGES.itemsAdded);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('rolls back earlier shopping rows when a later add fails', async () => {
    const eggId = await seedProduct('Œuf');
    const butterId = await seedProduct('Beurre');
    const recipeId = await seedRecipe('Omelette', [
      { productId: eggId, quantityG: 120 },
      { productId: butterId, quantityG: 10 },
    ]);

    const original = shopping.addManualItem.bind(shopping);
    let calls = 0;
    vi.spyOn(shopping, 'addManualItem').mockImplementation(async (productId, quantityG) => {
      calls += 1;
      if (calls === 2) {
        throw new Error('Liste indisponible.');
      }
      return original(productId, quantityG);
    });

    service.openMenu({ kind: 'recipe', recipeId, recipeTitle: 'Omelette' });
    await service.handleMenuAction('shopping');

    expect(service.actionError()).toBe('Liste indisponible.');
    expect(await database.listShoppingListItemsWithProducts()).toEqual([]);
  });

  it('surfaces a French error when the recipe cannot be loaded for pantry', async () => {
    service.openMenu({
      kind: 'recipe',
      recipeId: 'missing-recipe-id',
      recipeTitle: 'Fantôme',
    });
    await service.handleMenuAction('pantry');

    expect(service.actionError()).toBe('Recette introuvable.');
    expect(service.sheet()).toBeNull();
  });

  it('shows a French empty message when the default variant has no ingredients', async () => {
    const productId = await seedProduct('Œuf');
    const recipeId = await seedRecipe('Vide', [{ productId, quantityG: 120 }]);

    const db = new NutritionDatabase();
    await db.open();
    await db.recipeIngredients.clear();
    await db.close();

    service.openMenu({ kind: 'recipe', recipeId, recipeTitle: 'Vide' });
    await service.handleMenuAction('shopping');

    expect(service.actionError()).toBe(CONTEXT_SHORTCUT_MESSAGES.emptyVariant);
    expect(await database.listShoppingListItemsWithProducts()).toEqual([]);
  });
});
