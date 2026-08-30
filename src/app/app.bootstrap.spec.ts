import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppBootstrapService } from './core/bootstrap/app-bootstrap.service';
import { DatabaseService } from './core/database/database.service';
import { deleteNutritionDatabase } from './core/database/nutrition-database.testing';
import { ThemeService } from './core/layout/theme/theme.service';

describe('app bootstrap', () => {
  beforeEach(async () => {
    await deleteNutritionDatabase();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  afterEach(async () => {
    const database = TestBed.inject(DatabaseService);
    await database.closeForTests();
    await deleteNutritionDatabase();
    delete document.documentElement.dataset['theme'];
  });

  it('initializes database and applies dark theme on startup', async () => {
    const database = TestBed.inject(DatabaseService);
    const theme = TestBed.inject(ThemeService);
    const bootstrap = TestBed.inject(AppBootstrapService);

    await database.initialize();
    await theme.applyFromSettings();

    expect(bootstrap.bootstrapError()).toBeNull();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(theme.currentTheme()).toBe('dark');
  });

  it('records bootstrap error and applies fallback dark theme when storage fails', async () => {
    const theme = TestBed.inject(ThemeService);
    const bootstrap = TestBed.inject(AppBootstrapService);
    const storageError = new Error('IndexedDB blocked');

    try {
      throw storageError;
    } catch {
      bootstrap.setBootstrapError(
        'Stockage local indisponible. Vérifiez que le mode navigation privée est désactivé et réessayez.',
      );
      theme.applyTheme('dark');
    }

    expect(bootstrap.bootstrapError()).toContain('Stockage local indisponible');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(theme.currentTheme()).toBe('dark');
  });
});
