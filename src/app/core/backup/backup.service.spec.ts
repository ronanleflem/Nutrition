import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION } from './backup-schema';
import { BackupService } from './backup.service';

describe('BackupService', () => {
  let database: DatabaseService;
  let backupService: BackupService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    backupService = TestBed.inject(BackupService);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('builds export payload with all MVP tables', async () => {
    const product = await database.createProduct({ name: 'Pomme' });
    await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Pomme bio',
      barcode: '1234567890123',
      kcalPer100g: 52,
      proteinPer100g: 0.3,
      fatPer100g: 0.2,
      carbsPer100g: 14,
    });
    await database.archiveProduct(product.id);

    const payload = await backupService.buildExportPayload();

    expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(payload.app).toBe(BACKUP_APP_ID);
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.data.products).toHaveLength(1);
    expect(payload.data.products[0].deletedAt).toBeTruthy();
    expect(payload.data.productReferences).toHaveLength(1);
    expect(payload.data.recipeVariants).toEqual([]);
    expect(payload.data.macroGoals.length).toBeGreaterThan(0);
    expect(payload.data.appSettings.length).toBeGreaterThan(0);
  });

  it('exports plain JSON and updates lastExportAt', async () => {
    const downloads: Array<{ blob: Blob; filename: string }> = [];
    stubFileDownload(downloads);

    await backupService.exportToFile({ encrypt: false });

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/\.nutrition-backup\.json$/);

    const text = await downloads[0].blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(parsed.data.products).toBeDefined();
    expect(parsed.data.productReferences).toBeDefined();
    expect(parsed.data.recipeVariants).toBeDefined();

    const settings = await database.getAppSettings();
    expect(settings.lastExportAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports encrypted file with .nutrition-backup.enc extension', async () => {
    const downloads: Array<{ blob: Blob; filename: string }> = [];
    stubFileDownload(downloads);

    await backupService.exportToFile({ encrypt: true, password: 'strong-password' });

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/\.nutrition-backup\.enc$/);
  });

  it('strips FoodRepo API key from export payload', async () => {
    await database.updateFoodRepoApiKey('secret-foodrepo-key');

    const payload = await backupService.buildExportPayload();
    const settings = payload.data.appSettings[0];

    expect(settings?.foodRepoApiKey).toBeUndefined();

    const localSettings = await database.getAppSettings();
    expect(localSettings.foodRepoApiKey).toBe('secret-foodrepo-key');
  });
});

function stubFileDownload(downloads: Array<{ blob: Blob; filename: string }>): void {
  let lastBlob: Blob | null = null;
  const anchor = {
    href: '',
    download: '',
    style: { display: '' },
    click: vi.fn(() => {
      if (lastBlob) {
        downloads.push({ blob: lastBlob, filename: anchor.download });
      }
    }),
  };

  vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor as unknown as Node);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor as unknown as Node);
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    lastBlob = blob as Blob;
    return 'blob:mock';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
}
