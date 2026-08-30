import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Dexie from 'dexie';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { ProductsService } from './services/products.service';
import { ProductsPageComponent } from './products-page.component';
import { PRODUCTS_ROUTES } from './products.routes';

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let database: DatabaseService;
  let productsService: ProductsService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [provideRouter([{ path: 'products', children: PRODUCTS_ROUTES }])],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    productsService = TestBed.inject(ProductsService);
    fixture = TestBed.createComponent(ProductsPageComponent);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function waitForLoad(): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (!productsService.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Products page load timed out');
  }

  it('shows empty state when catalogue is empty', async () => {
    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain('Aucun produit dans votre catalogue.');
  });

  it('lists created products after load', async () => {
    await database.createProduct({ name: 'Poulet blanc', category: 'VIANDE', priority: 'green' });

    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain('Poulet blanc');
    expect(fixture.nativeElement.textContent).toContain('VIANDE');
  });
});
