import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';

import { DatabaseService } from '../../database/database.service';
import { deleteNutritionDatabase } from '../../database/nutrition-database';
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
  });
});
