import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';

import { DatabaseService } from '../../database/database.service';
import { NutritionDatabase } from '../../database/nutrition-database';
import { APP_SETTINGS_SINGLETON_ID } from '../../models/app-settings';
import { deleteNutritionDatabase } from '../../database/nutrition-database.testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    database = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
    delete document.documentElement.dataset['theme'];
  });

  it('applies dark theme from appSettings', async () => {
    const theme = await service.applyFromSettings();

    expect(theme).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(service.currentTheme()).toBe('dark');
  });

  it('always applies dark theme even when legacy settings stored light', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'light' as 'dark',
    });
    await db.close();

    const theme = await service.applyFromSettings();

    expect(theme).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(service.currentTheme()).toBe('dark');
  });

  it('applyTheme always resolves to dark', () => {
    const theme = service.applyTheme();

    expect(theme).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(service.currentTheme()).toBe('dark');
  });
});
