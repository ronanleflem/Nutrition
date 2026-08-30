import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { APP_SETTINGS_SINGLETON_ID } from '../models/app-settings';
import { createProduct } from '../models/product';
import { NUTRITION_DB_NAME, NutritionDatabase } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
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

  it('seeds appSettings with dark theme on first launch', async () => {
    await service.initialize();

    const settings = await service.getAppSettings();
    expect(settings).toEqual({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
    });
  });

  it('is idempotent when initialize is called twice', async () => {
    await service.initialize();
    await service.initialize();

    const db = new NutritionDatabase();
    await db.open();
    const rows = await db.appSettings.toArray();
    await db.close();

    expect(rows).toHaveLength(1);
    expect(rows[0].theme).toBe('dark');
  });

  it('persists appSettings across service re-instantiation', async () => {
    await service.initialize();
    await service.closeForTests();

    const reloaded = TestBed.inject(DatabaseService);
    const settings = await reloaded.getAppSettings();

    expect(settings.id).toBe(APP_SETTINGS_SINGLETON_ID);
    expect(settings.theme).toBe('dark');
  });

  it('reseeds appSettings when singleton is missing after initialization', async () => {
    await service.initialize();
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.clear();
    await db.close();

    const settings = await service.getAppSettings();

    expect(settings.id).toBe(APP_SETTINGS_SINGLETON_ID);
    expect(settings.theme).toBe('dark');
  });

  it('creates a product and returns it from listActiveProducts', async () => {
    const created = await service.createProduct({
      name: 'Skyr nature',
      category: 'LAITIER',
      priority: 'green',
      notes: 'Test',
    });

    const products = await service.listActiveProducts();

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: created.id,
      name: 'Skyr nature',
      category: 'LAITIER',
      priority: 'green',
      notes: 'Test',
      deletedAt: null,
    });
    expect(products[0].createdAt).toBeTruthy();
    expect(products[0].updatedAt).toBeTruthy();
  });

  it('excludes soft-deleted products from listActiveProducts', async () => {
    const active = await service.createProduct({ name: 'Actif' });
    const archived = createProduct({ name: 'Archivé' });
    archived.deletedAt = new Date().toISOString();

    const db = new NutritionDatabase();
    await db.open();
    await db.products.put(archived);
    await db.close();

    const products = await service.listActiveProducts();

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe(active.id);
  });

  it('sorts active products by French name', async () => {
    await service.createProduct({ name: 'Épinards' });
    await service.createProduct({ name: 'Avocat' });
    await service.createProduct({ name: 'Banane' });

    const products = await service.listActiveProducts();

    expect(products.map((product) => product.name)).toEqual(['Avocat', 'Banane', 'Épinards']);
  });

  it('updates a product and refreshes updatedAt', async () => {
    const created = await service.createProduct({ name: 'Original' });

    const updated = await service.updateProduct(created.id, {
      name: 'Modifié',
      category: 'SAUCE',
      priority: 'yellow',
      notes: 'Note',
    });

    expect(updated.name).toBe('Modifié');
    expect(updated.category).toBe('SAUCE');
    expect(updated.priority).toBe('yellow');
    expect(updated.notes).toBe('Note');
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it('throws when updating a missing product', async () => {
    await expect(
      service.updateProduct('missing-id', { name: 'Test' }),
    ).rejects.toThrow(/introuvable/i);
  });
});
