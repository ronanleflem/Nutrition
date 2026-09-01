import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { APP_SETTINGS_SINGLETON_ID } from '../models/app-settings';
import { MACRO_GOALS_SINGLETON_ID } from '../models/macro-goals';
import { BackupCryptoService } from './backup-crypto.service';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION } from './backup-schema';
import { BackupService } from './backup.service';

describe('BackupService import', () => {
  let database: DatabaseService;
  let backupService: BackupService;
  let backupCrypto: BackupCryptoService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    backupService = TestBed.inject(BackupService);
    backupCrypto = TestBed.inject(BackupCryptoService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('round-trips replace import without data loss', async () => {
    const product = await database.createProduct({ name: 'Banane' });
    await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Banane bio',
      barcode: '3017620422003',
      kcalPer100g: 89,
      proteinPer100g: 1.1,
      fatPer100g: 0.3,
      carbsPer100g: 23,
    });

    const payload = await backupService.buildExportPayload();
    const file = new File([JSON.stringify(payload)], 'backup.nutrition-backup.json', {
      type: 'application/json',
    });

    await database.replaceAllFromBackup({
      products: [],
      productReferences: [],
      pantryItems: [],
      recipes: [],
      recipeVariants: [],
      recipeIngredients: [],
      mealPlanEntries: [],
      shoppingListItems: [],
      macroGoals: [],
      appSettings: [],
    });

    const summary = await backupService.importFromFile(file, { mode: 'replace' });

    expect(summary.products).toBe(1);
    expect(summary.productReferences).toBe(1);
    expect((await database.listActiveProducts()).map((item) => item.name)).toEqual(['Banane']);
  });

  it('rejects wrong password without altering current data', async () => {
    await database.createProduct({ name: 'Local seul' });
    const payload = await backupService.buildExportPayload();
    const envelope = await backupCrypto.encrypt(JSON.stringify(payload), 'correct-password');
    const file = new File([JSON.stringify(envelope)], 'backup.nutrition-backup.enc', {
      type: 'application/json',
    });

    await expect(
      backupService.importFromFile(file, { mode: 'replace', password: 'wrong-password' }),
    ).rejects.toThrow('Mot de passe incorrect.');

    expect((await database.listActiveProducts()).map((item) => item.name)).toEqual(['Local seul']);
  });

  it('merges pantry quantities for matching products by barcode', async () => {
    const localProduct = await database.createProduct({ name: 'Pomme' });
    await database.createProductReference({
      productId: localProduct.id,
      store: 'auchan',
      label: 'Pomme locale',
      barcode: '1234567890123',
      kcalPer100g: 52,
      proteinPer100g: 0.3,
      fatPer100g: 0.2,
      carbsPer100g: 14,
    });
    await database.addPantryItem({ productId: localProduct.id, quantityG: 100 });

    const importedProductId = crypto.randomUUID();
    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: '2026-09-01T00:00:00.000Z',
      app: BACKUP_APP_ID,
      data: {
        products: [
          {
            id: importedProductId,
            name: 'Pomme importée',
            recommendedStores: ['auchan'],
            deletedAt: null,
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: '2026-09-01T00:00:00.000Z',
          },
        ],
        productReferences: [
          {
            id: crypto.randomUUID(),
            productId: importedProductId,
            store: 'auchan',
            label: 'Pomme import',
            barcode: '1234567890123',
            kcalPer100g: 52,
            proteinPer100g: 0.3,
            fatPer100g: 0.2,
            carbsPer100g: 14,
            nutritionalScore: 80,
            deletedAt: null,
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: '2026-09-01T00:00:00.000Z',
          },
        ],
        pantryItems: [
          {
            id: crypto.randomUUID(),
            productId: importedProductId,
            quantityG: 250,
            updatedAt: '2026-09-01T00:00:00.000Z',
          },
        ],
        recipes: [],
        recipeVariants: [],
        recipeIngredients: [],
        mealPlanEntries: [],
        shoppingListItems: [],
        macroGoals: [{ id: MACRO_GOALS_SINGLETON_ID, kcal: 2100 }],
        appSettings: [
          {
            id: APP_SETTINGS_SINGLETON_ID,
            theme: 'dark',
            lastExportAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
    };

    const file = new File([JSON.stringify(payload)], 'merge.nutrition-backup.json', {
      type: 'application/json',
    });

    const summary = await backupService.importFromFile(file, { mode: 'merge' });

    expect(summary.productsUpdated).toBe(1);
    expect(summary.pantryItems).toBe(1);
    const pantry = await database.listPantryItemsWithProducts();
    expect(pantry[0].quantityG).toBe(350);
    expect((await database.getMacroGoals()).kcal).toBe(2100);
  });
});
