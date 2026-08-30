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

  it('creates a product reference with computed nutritionalScore', async () => {
    const product = await service.createProduct({ name: 'Skyr nature' });

    const reference = await service.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Skyr 0% Auchan',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });

    expect(reference.nutritionalScore).toBeGreaterThan(0);
    expect(reference.nutritionalScore).toBeLessThanOrEqual(100);

    const stored = await service.getProductReference(reference.id);
    expect(stored?.nutritionalScore).toBe(reference.nutritionalScore);
  });

  it('derives recommendedStores from references sorted by score', async () => {
    const product = await service.createProduct({ name: 'Skyr nature' });

    await service.createProductReference({
      productId: product.id,
      store: 'leclerc',
      label: 'Skyr Leclerc',
      kcalPer100g: 290,
      proteinPer100g: 8,
      fatPer100g: 4,
      carbsPer100g: 52,
    });

    const better = await service.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Skyr Auchan',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });

    const updatedProduct = await service.getProduct(product.id);
    expect(updatedProduct?.recommendedStores).toEqual(['auchan', 'leclerc']);

    await service.setPreferredReference(product.id, better.id);
    const preferredProduct = await service.getProduct(product.id);
    expect(preferredProduct?.preferredReferenceId).toBe(better.id);
  });

  it('attaches preferredReference to catalog items', async () => {
    const product = await service.createProduct({ name: 'Skyr nature' });
    const reference = await service.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Skyr Auchan',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });

    await service.setPreferredReference(product.id, reference.id);

    const catalog = await service.listProductCatalog();
    expect(catalog).toHaveLength(1);
    expect(catalog[0].preferredReference?.id).toBe(reference.id);
    expect(catalog[0].preferredReference?.nutritionalScore).toBe(reference.nutritionalScore);
  });

  it('sorts catalog by preferred reference score descending', async () => {
    const low = await service.createProduct({ name: 'Wrap' });
    const high = await service.createProduct({ name: 'Skyr' });

    const lowRef = await service.createProductReference({
      productId: low.id,
      store: 'leclerc',
      label: 'Wrap',
      kcalPer100g: 290,
      proteinPer100g: 8,
      fatPer100g: 4,
      carbsPer100g: 52,
    });

    const highRef = await service.createProductReference({
      productId: high.id,
      store: 'auchan',
      label: 'Skyr',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });

    await service.setPreferredReference(low.id, lowRef.id);
    await service.setPreferredReference(high.id, highRef.id);

    const catalog = await service.listProductCatalog();
    expect(catalog.map((item) => item.product.name)).toEqual(['Skyr', 'Wrap']);
  });

  it('finds an active reference by barcode', async () => {
    const product = await service.createProduct({ name: 'Nutella' });
    const reference = await service.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Nutella pot',
      barcode: '3017620422003',
      kcalPer100g: 539,
      proteinPer100g: 6.3,
      fatPer100g: 30.9,
      carbsPer100g: 57.5,
    });

    const found = await service.getActiveReferenceByBarcode('3017620422003');

    expect(found?.id).toBe(reference.id);
  });

  it('archives and restores a product', async () => {
    const product = await service.createProduct({ name: 'Yaourt' });

    const archived = await service.archiveProduct(product.id);
    expect(archived.deletedAt).toBeTruthy();

    const activeProducts = await service.listActiveProducts();
    expect(activeProducts).toHaveLength(0);

    const archivedProducts = await service.listArchivedProducts();
    expect(archivedProducts).toHaveLength(1);
    expect(archivedProducts[0].name).toBe('Yaourt');

    const restored = await service.restoreProduct(product.id);
    expect(restored.deletedAt).toBeNull();
    expect((await service.listActiveProducts()).map((item) => item.name)).toEqual(['Yaourt']);
  });

  it('finds a reference by barcode including archived products', async () => {
    const product = await service.createProduct({ name: 'Nutella' });
    const reference = await service.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Nutella pot',
      barcode: '3017620422003',
      kcalPer100g: 539,
      proteinPer100g: 6.3,
      fatPer100g: 30.9,
      carbsPer100g: 57.5,
    });

    await service.archiveProduct(product.id);

    const match = await service.findReferenceByBarcode('3017620422003');

    expect(match?.reference.id).toBe(reference.id);
    expect(match?.product.id).toBe(product.id);
    expect(match?.product.deletedAt).toBeTruthy();
  });
});
