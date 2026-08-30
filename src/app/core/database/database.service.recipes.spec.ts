import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { createProduct } from '../models/product';
import { createProductReference } from '../models/product-reference';
import { NUTRITION_DB_NAME } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService recipes', () => {
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

  async function createSampleRecipe(): Promise<{ recipeId: string; variantId: string; productId: string }> {
    const productId = await seedProductWithPreferredReference('Poulet');
    const result = await service.createRecipeWithFirstVariant({
      recipe: {
        title: 'Wrap poulet',
        steps: ['Couper', 'Assembler'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId, quantityG: 150 }],
    });

    return { recipeId: result.recipe.id, variantId: result.variantId, productId };
  }

  it('creates recipe with first variant and ingredients', async () => {
    const productId = await seedProductWithPreferredReference('Poulet');

    const result = await service.createRecipeWithFirstVariant({
      recipe: {
        title: 'Wrap poulet',
        steps: ['Couper le poulet', 'Assembler le wrap'],
        defaultPortions: 2,
        tags: ['rapide'],
      },
      variantName: 'Classique',
      ingredients: [{ productId, quantityG: 150 }],
    });

    expect(result.recipe.title).toBe('Wrap poulet');
    expect(result.recipe.defaultVariantId).toBe(result.variantId);
    expect(result.ingredients).toHaveLength(1);
    expect(result.ingredients[0].productId).toBe(productId);

    const list = await service.listRecipes();
    expect(list).toHaveLength(1);
    expect(list[0].recipe.title).toBe('Wrap poulet');
    expect(list[0].defaultVariantName).toBe('Classique');
  });

  it('rejects recipe without steps', async () => {
    const productId = await seedProductWithPreferredReference('Riz');

    await expect(
      service.createRecipeWithFirstVariant({
        recipe: {
          title: 'Riz simple',
          steps: [''],
          defaultPortions: 1,
        },
        variantName: 'Base',
        ingredients: [{ productId, quantityG: 100 }],
      }),
    ).rejects.toThrow(/étape/i);
  });

  it('rejects recipe without ingredients', async () => {
    await expect(
      service.createRecipeWithFirstVariant({
        recipe: {
          title: 'Vide',
          steps: ['Faire quelque chose'],
          defaultPortions: 1,
        },
        variantName: 'Base',
        ingredients: [],
      }),
    ).rejects.toThrow(/ingrédient/i);
  });

  it('rejects ingredient with zero quantity', async () => {
    const productId = await seedProductWithPreferredReference('Sel');

    await expect(
      service.createRecipeWithFirstVariant({
        recipe: {
          title: 'Test',
          steps: ['Étape'],
          defaultPortions: 1,
        },
        variantName: 'Base',
        ingredients: [{ productId, quantityG: 0 }],
      }),
    ).rejects.toThrow(/quantité/i);
  });

  it('rejects ingredient when product has no preferred reference', async () => {
    const product = await service.createProduct({ name: 'Sans ref' });

    await expect(
      service.createRecipeWithFirstVariant({
        recipe: {
          title: 'Test',
          steps: ['Étape'],
          defaultPortions: 1,
        },
        variantName: 'Base',
        ingredients: [{ productId: product.id, quantityG: 50 }],
      }),
    ).rejects.toThrow(/référence préférée/i);
  });

  it('adds an additional variant with its own ingredients', async () => {
    const { recipeId, productId } = await createSampleRecipe();
    const lavashId = await seedProductWithPreferredReference('Lavash');

    const added = await service.addRecipeVariant({
      recipeId,
      name: 'Lavash',
      rating: 4,
      ingredients: [{ productId: lavashId, quantityG: 80 }, { productId, quantityG: 120 }],
    });

    const detail = await service.getRecipeDetail(recipeId);
    expect(detail?.variants).toHaveLength(2);
    const lavash = detail?.variants.find((variant) => variant.id === added.variantId);
    expect(lavash?.name).toBe('Lavash');
    expect(lavash?.rating).toBe(4);
    expect(lavash?.ingredients).toHaveLength(2);
  });

  it('updates variant rating within 1-5', async () => {
    const { recipeId, variantId } = await createSampleRecipe();

    await service.updateVariantRating(variantId, 5);

    const detail = await service.getRecipeDetail(recipeId);
    const variant = detail?.variants.find((item) => item.id === variantId);
    expect(variant?.rating).toBe(5);

    await service.updateVariantRating(variantId, null);
    const cleared = await service.getRecipeDetail(recipeId);
    const clearedVariant = cleared?.variants.find((item) => item.id === variantId);
    expect(clearedVariant?.rating).toBeUndefined();
  });

  it('rejects invalid variant rating', async () => {
    const { variantId } = await createSampleRecipe();

    await expect(service.updateVariantRating(variantId, 6)).rejects.toThrow(/note/i);
  });

  it('sets default variant among existing variants', async () => {
    const { recipeId, variantId, productId } = await createSampleRecipe();
    const added = await service.addRecipeVariant({
      recipeId,
      name: 'Double protéine',
      ingredients: [{ productId, quantityG: 250 }],
    });

    const updated = await service.setDefaultVariant(recipeId, added.variantId);
    expect(updated.defaultVariantId).toBe(added.variantId);
    expect(updated.defaultVariantId).not.toBe(variantId);

    const list = await service.listRecipes();
    expect(list[0].defaultVariantName).toBe('Double protéine');
  });

  it('rejects default variant from another recipe', async () => {
    const first = await createSampleRecipe();
    const second = await createSampleRecipe();

    await expect(service.setDefaultVariant(first.recipeId, second.variantId)).rejects.toThrow(
      /variante introuvable/i,
    );
  });

  it('enriches recipe detail ingredients with preferred reference macros', async () => {
    const { recipeId } = await createSampleRecipe();

    const detail = await service.getRecipeDetail(recipeId);
    const ingredient = detail?.variants[0]?.ingredients[0];

    expect(ingredient?.macrosPer100g).toEqual({
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 12,
      fiberPer100g: undefined,
      saltPer100g: undefined,
    });
  });

  it('updates recipe family metadata', async () => {
    const { recipeId } = await createSampleRecipe();

    const updated = await service.updateRecipe(recipeId, {
      title: 'Wrap poulet épicé',
      steps: ['Nouvelle étape'],
      defaultPortions: 3,
      tags: ['épicé'],
      notes: 'Test',
    });

    expect(updated.title).toBe('Wrap poulet épicé');
    expect(updated.steps).toEqual(['Nouvelle étape']);
    expect(updated.defaultPortions).toBe(3);
  });

  it('deletes recipe with variants and ingredients', async () => {
    const { recipeId } = await createSampleRecipe();

    await service.deleteRecipe(recipeId);

    expect(await service.getRecipeDetail(recipeId)).toBeUndefined();
    expect(await service.listRecipes()).toHaveLength(0);
  });

  it('deletes recipe and associated meal plan entries', async () => {
    const { recipeId } = await createSampleRecipe();

    await service.createMealPlanEntry({
      date: '2026-08-31',
      slot: 'lunch',
      recipeId,
    });

    expect(await service.countMealPlanEntriesForRecipe(recipeId)).toBe(1);

    await service.deleteRecipe(recipeId);

    expect(await service.countMealPlanEntriesForRecipe(recipeId)).toBe(0);
    expect(await service.getRecipeDetail(recipeId)).toBeUndefined();
  });
});
