import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../core/database/nutrition-database.testing';
import { RecipesService } from './recipes.service';

describe('RecipesService appendIngredientToDefaultVariant', () => {
  let service: RecipesService;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipesService);
    database = TestBed.inject(DatabaseService);
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
      fatPer100g: 5,
      carbsPer100g: 8,
    });
    await database.setPreferredReference(product.id, reference.id);
    return product.id;
  }

  it('appends the ingredient and reloads the recipe list', async () => {
    const chickenId = await seedProduct('Poulet');
    const cheeseId = await seedProduct('Fromage');
    const created = await service.createRecipeWithFirstVariant({
      recipe: { title: 'Wrap', steps: ['Assembler'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: chickenId, quantityG: 120 }],
    });

    expect(service.recipes()).toHaveLength(1);

    await service.appendIngredientToDefaultVariant(created.recipe.id, {
      productId: cheeseId,
      quantityG: 30,
    });

    const detail = await database.getRecipeDetail(created.recipe.id);
    expect(detail?.variants[0]?.ingredients).toHaveLength(2);
    expect(service.recipes()[0]?.recipe.title).toBe('Wrap');
  });
});
