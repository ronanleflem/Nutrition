import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { AppBootstrapService } from './core/bootstrap/app-bootstrap.service';
import { DatabaseService } from './core/database/database.service';
import { deleteNutritionDatabase } from './core/database/nutrition-database.testing';

describe('App', () => {
  beforeEach(async () => {
    await deleteNutritionDatabase();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(async () => {
    const database = TestBed.inject(DatabaseService);
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows bootstrap error message when storage initialization fails', async () => {
    const database = TestBed.inject(DatabaseService);
    await database.initialize();

    const dbModule = await import('./core/database/nutrition-database');
    const db = new dbModule.NutritionDatabase();
    await db.open();
    await db.delete();
    await db.close();
    await database.closeForTests();

    const bootstrap = TestBed.inject(AppBootstrapService);
    bootstrap.setBootstrapError(
      'Stockage local indisponible. Vérifiez que le mode navigation privée est désactivé et réessayez.',
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.bootstrap-error');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Stockage local indisponible');
  });
});
