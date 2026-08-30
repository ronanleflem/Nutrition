import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { APP_SETTINGS_SINGLETON_ID } from '../models/app-settings';
import {
  deleteNutritionDatabase,
  NUTRITION_DB_NAME,
  NutritionDatabase,
} from './nutrition-database';
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

  it('throws when appSettings singleton is missing after initialization', async () => {
    await service.initialize();
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.clear();
    await db.close();

    await expect(service.getAppSettings()).rejects.toThrow(
      'AppSettings singleton is missing after database initialization.',
    );
  });
});
