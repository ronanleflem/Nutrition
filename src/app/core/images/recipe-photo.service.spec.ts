/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { IMAGE_WEBP_MIME } from '../models/image-blob';
import { RECIPE_PHOTO_ADD_ERROR, RECIPE_PHOTO_REPLACE_ERROR } from './recipe-photo.messages';
import { RecipePhotoService } from './recipe-photo.service';

describe('RecipePhotoService', () => {
  let service: RecipePhotoService;
  let database: DatabaseService;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['webp'], { type: IMAGE_WEBP_MIME }));
    });

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName !== 'canvas') {
        throw new Error(`Unexpected element: ${tagName}`);
      }

      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob,
      } as unknown as HTMLCanvasElement;
    });

    globalThis.createImageBitmap = vi.fn(async () => ({
      width: 400,
      height: 300,
      close: vi.fn(),
    })) as typeof createImageBitmap;

    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipePhotoService);
    database = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    vi.restoreAllMocks();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function createRecipe(): Promise<string> {
    const product = await database.createProduct({ name: 'Poulet' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: 'Poulet ref',
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 12,
    });
    await database.setPreferredReference(product.id, reference.id);

    const result = await database.createRecipeWithFirstVariant({
      recipe: {
        title: 'Wrap poulet',
        steps: ['Couper'],
        defaultPortions: 2,
      },
      variantName: 'Classique',
      ingredients: [{ productId: product.id, quantityG: 120 }],
    });

    return result.recipe.id;
  }

  it('attaches a photo to a recipe without an existing blob', async () => {
    const recipeId = await createRecipe();

    await service.attachPhoto(recipeId, new Blob(['png'], { type: 'image/png' }));

    const detail = await database.getRecipeDetail(recipeId);
    expect(detail?.recipe.photoBlobId).toBeTruthy();
  });

  it('replaces an existing photo and removes the previous blob', async () => {
    const recipeId = await createRecipe();
    await service.attachPhoto(recipeId, new Blob(['one'], { type: 'image/png' }));
    const firstBlobId = (await database.getRecipeDetail(recipeId))?.recipe.photoBlobId;

    await service.attachPhoto(recipeId, new Blob(['two'], { type: 'image/png' }));
    const secondBlobId = (await database.getRecipeDetail(recipeId))?.recipe.photoBlobId;

    expect(secondBlobId).toBeTruthy();
    expect(secondBlobId).not.toBe(firstBlobId);
    expect(await database.getImageBlob(firstBlobId!)).toBeUndefined();
  });

  it('removes a photo and deletes the unreferenced blob', async () => {
    const recipeId = await createRecipe();
    await service.attachPhoto(recipeId, new Blob(['png'], { type: 'image/png' }));
    const blobId = (await database.getRecipeDetail(recipeId))?.recipe.photoBlobId;

    await service.removePhoto(recipeId);

    expect((await database.getRecipeDetail(recipeId))?.recipe.photoBlobId).toBeUndefined();
    expect(await database.getImageBlob(blobId!)).toBeUndefined();
  });

  it('throws the add error message when the first attach fails', async () => {
    globalThis.createImageBitmap = vi.fn(async () => {
      throw new Error('decode failed');
    }) as typeof createImageBitmap;

    const recipeId = await createRecipe();

    await expect(service.attachPhoto(recipeId, new Blob(['bad'], { type: 'image/png' }))).rejects.toThrow(
      RECIPE_PHOTO_ADD_ERROR,
    );
  });

  it('throws the replace error message when replacing an existing photo fails', async () => {
    const recipeId = await createRecipe();
    await service.attachPhoto(recipeId, new Blob(['one'], { type: 'image/png' }));
    const previousId = (await database.getRecipeDetail(recipeId))?.recipe.photoBlobId;

    globalThis.createImageBitmap = vi.fn(async () => {
      throw new Error('decode failed');
    }) as typeof createImageBitmap;

    await expect(service.attachPhoto(recipeId, new Blob(['two'], { type: 'image/png' }))).rejects.toThrow(
      RECIPE_PHOTO_REPLACE_ERROR,
    );

    expect((await database.getRecipeDetail(recipeId))?.recipe.photoBlobId).toBe(previousId);
  });
});
