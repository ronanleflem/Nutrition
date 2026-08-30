import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { NUTRITION_DB_NAME, NutritionDatabase } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService pantry', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseService);
    await service.initialize();
  });

  afterEach(async () => {
    await service.closeForTests();
    await deleteNutritionDatabase();
  });

  it('creates a pantry line for an active product', async () => {
    const product = await service.createProduct('Yaourt nature');

    const item = await service.addPantryItem({
      productId: product.id,
      quantityG: 250,
      expiryDate: '2026-09-15',
      location: 'Frigo',
    });

    expect(item.productId).toBe(product.id);
    expect(item.quantityG).toBe(250);
    expect(item.expiryDate).toBe('2026-09-15');
    expect(item.location).toBe('Frigo');

    const rows = await service.listPantryItemsWithProducts();
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe('Yaourt nature');
  });

  it('rejects pantry add for archived product', async () => {
    const product = await service.createProduct('Skyr');
    const db = new NutritionDatabase();
    await db.open();
    await db.products.update(product.id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.close();

    await expect(
      service.addPantryItem({ productId: product.id, quantityG: 100 }),
    ).rejects.toThrow(/introuvable|archivé/i);
  });

  it('updates pantry quantity and refreshes updatedAt', async () => {
    const product = await service.createProduct('Riz');
    const created = await service.addPantryItem({ productId: product.id, quantityG: 500 });

    const updated = await service.updatePantryItem(created.id, { quantityG: 400 });

    expect(updated).not.toBeNull();
    expect(updated!.quantityG).toBe(400);
    expect(updated!.updatedAt >= created.updatedAt).toBe(true);
  });

  it('deletes pantry row when quantity reaches zero', async () => {
    const product = await service.createProduct('Pâtes');
    const created = await service.addPantryItem({ productId: product.id, quantityG: 300 });

    const result = await service.updatePantryItem(created.id, { quantityG: 0 });

    expect(result).toBeNull();
    const rows = await service.listPantryItemsWithProducts();
    expect(rows).toHaveLength(0);
  });

  it('deletes pantry row explicitly', async () => {
    const product = await service.createProduct('Tomates');
    const created = await service.addPantryItem({ productId: product.id, quantityG: 200 });

    await service.deletePantryItem(created.id);

    const rows = await service.listPantryItemsWithProducts();
    expect(rows).toHaveLength(0);
  });

  it('allows minimal product creation when catalogue is empty', async () => {
    const products = await service.listActiveProducts();
    expect(products).toHaveLength(0);

    const product = await service.createProduct('Bananes');
    const active = await service.listActiveProducts();

    expect(active).toHaveLength(1);
    expect(product.name).toBe('Bananes');
  });

  it('supports separate lines for the same product', async () => {
    const product = await service.createProduct('Fromage');
    await service.addPantryItem({ productId: product.id, quantityG: 100, location: 'Frigo' });
    await service.addPantryItem({ productId: product.id, quantityG: 50, location: 'Cellier' });

    const rows = await service.listPantryItemsWithProducts();
    expect(rows).toHaveLength(2);
  });
});
