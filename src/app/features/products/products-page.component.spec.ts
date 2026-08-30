import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Dexie from 'dexie';
import { By } from '@angular/platform-browser';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { ProductsService } from './services/products.service';
import { ProductsPageComponent } from './products-page.component';

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let database: DatabaseService;
  let productsService: ProductsService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [
        provideRouter([
          { path: 'products', children: [{ path: '', component: ProductsPageComponent }] },
          { path: 'products/scan', component: ProductsPageComponent },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    productsService = TestBed.inject(ProductsService);
    productsService.catalog.set([]);
    productsService.loading.set(false);
    fixture = TestBed.createComponent(ProductsPageComponent);
  });

  afterEach(async () => {
    fixture.destroy();
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

  it('filters products by search query', async () => {
    await database.createProduct({ name: 'Skyr nature' });
    await database.createProduct({ name: 'Poulet blanc' });

    fixture.detectChanges();
    await waitForLoad();

    const searchInput = fixture.debugElement.query(
      By.css('.products-page__search-input'),
    ).nativeElement as HTMLInputElement;
    searchInput.value = 'skyr';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Skyr nature');
    expect(fixture.nativeElement.textContent).not.toContain('Poulet blanc');
  });

  it('shows no-results message when search matches nothing', async () => {
    await database.createProduct({ name: 'Skyr nature' });

    fixture.detectChanges();
    await waitForLoad();

    const searchInput = fixture.debugElement.query(
      By.css('.products-page__search-input'),
    ).nativeElement as HTMLInputElement;
    searchInput.value = 'inexistant';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Aucun produit ne correspond à votre recherche.',
    );
  });

  it('shows scan FAB linking to scanner', async () => {
    fixture.detectChanges();
    await waitForLoad();

    const fab = fixture.debugElement.query(By.css('.products-page__fab'));
    expect(fab).toBeTruthy();
    expect(fab.nativeElement.textContent).toContain('Scan');
  });

  it('displays score and macros when preferred reference exists', async () => {
    const product = await database.createProduct({ name: 'Skyr nature', category: 'LAITIER' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Skyr Auchan',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });
    await database.setPreferredReference(product.id, reference.id);
    await productsService.loadCatalog();

    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain(String(reference.nutritionalScore));
    expect(fixture.nativeElement.textContent).toContain('57 kcal');
    expect(fixture.nativeElement.textContent).toContain('Auchan');
  });
});
