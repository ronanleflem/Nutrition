/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../database/nutrition-database';
import { IMAGE_WEBP_MIME } from '../models/image-blob';
import { ImageBlobService } from './image-blob.service';

describe('ImageBlobService', () => {
  let service: ImageBlobService;
  let database: DatabaseService;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['webp-bytes'], { type: IMAGE_WEBP_MIME }));
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
    service = TestBed.inject(ImageBlobService);
    database = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    vi.restoreAllMocks();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('stores, retrieves, and deletes image blobs', async () => {
    const source = new Blob(['png'], { type: 'image/png' });
    const id = await service.storeFromFile(source);

    const stored = await service.get(id);
    expect(stored?.type).toBe(IMAGE_WEBP_MIME);
    expect(await service.get('missing-id')).toBeUndefined();

    await service.delete(id);
    expect(await service.get(id)).toBeUndefined();
  });

  it('deletes the previous blob on replace when it is unreferenced', async () => {
    const firstId = await service.storeFromFile(new Blob(['one'], { type: 'image/png' }));
    const secondId = await service.replace(firstId, new Blob(['two'], { type: 'image/png' }));

    expect(secondId).not.toBe(firstId);
    expect(await service.get(firstId)).toBeUndefined();
    expect((await service.get(secondId))?.type).toBe(IMAGE_WEBP_MIME);
  });

  it('keeps the previous blob when it is still referenced', async () => {
    const blobId = await service.storeFromFile(new Blob(['shared'], { type: 'image/png' }));
    const recipeId = crypto.randomUUID();
    const variantId = crypto.randomUUID();
    const now = new Date().toISOString();

    const db = new NutritionDatabase();
    await db.recipes.put({
      id: recipeId,
      title: 'Omelette',
      steps: ['Battre', 'Cuire'],
      defaultPortions: 1,
      defaultVariantId: variantId,
      photoBlobId: blobId,
      createdAt: now,
      updatedAt: now,
    });
    db.close();

    const replacementId = await service.replace(blobId, new Blob(['next'], { type: 'image/png' }));

    expect(replacementId).not.toBe(blobId);
    expect((await service.get(blobId))?.type).toBe(IMAGE_WEBP_MIME);
    expect((await service.get(replacementId))?.type).toBe(IMAGE_WEBP_MIME);
  });
});
