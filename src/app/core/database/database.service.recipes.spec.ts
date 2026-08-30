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
});
