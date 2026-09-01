import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../database/nutrition-database';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { APP_SETTINGS_SINGLETON_ID } from '../models/app-settings';
import { BackupReminderService } from './backup-reminder.service';

describe('BackupReminderService', () => {
  let database: DatabaseService;
  let reminder: BackupReminderService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    reminder = TestBed.inject(BackupReminderService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('shows reminder when no export exists', async () => {
    await reminder.refresh();
    expect(reminder.visible()).toBe(true);
  });

  it('hides reminder after dismiss', async () => {
    await reminder.refresh();
    expect(reminder.visible()).toBe(true);

    await reminder.dismiss();
    expect(reminder.visible()).toBe(false);
  });

  it('hides reminder after recent export', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
      lastExportAt: new Date().toISOString(),
    });
    await db.close();

    await reminder.refresh();
    expect(reminder.visible()).toBe(false);
  });
});
