import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Dexie from 'dexie';

import { DatabaseService } from '../../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../../core/database/nutrition-database.testing';
import { ProductsService } from '../../../products/services/products.service';
import { ArchivedProductsPageComponent } from './archived-products-page.component';

describe('ArchivedProductsPageComponent', () => {
  let fixture: ComponentFixture<ArchivedProductsPageComponent>;
  let database: DatabaseService;
  let productsService: ProductsService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [ArchivedProductsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    productsService = TestBed.inject(ProductsService);
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function waitForLoad(): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (!fixture.componentInstance.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Archived products page load timed out');
  }

  it('lists archived products and restores them', async () => {
    const product = await database.createProduct({ name: 'Yaourt archivé' });
    await database.archiveProduct(product.id);

    expect((await productsService.listArchivedProducts()).map((item) => item.name)).toEqual([
      'Yaourt archivé',
    ]);

    fixture = TestBed.createComponent(ArchivedProductsPageComponent);
    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain('Yaourt archivé');

    await fixture.componentInstance.restoreProduct(product.id);
    await waitForLoad();

    expect((await productsService.listArchivedProducts()).length).toBe(0);
  });
});
