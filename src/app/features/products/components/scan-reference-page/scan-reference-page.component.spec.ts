import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { OffProductThumbService } from '../../../../core/images/off-product-thumb.service';
import { ProductsService } from '../../services/products.service';
import { ScanService } from '../../services/scan.service';
import { ScanReferencePageComponent } from './scan-reference-page.component';

describe('ScanReferencePageComponent', () => {
  let fixture: ComponentFixture<ScanReferencePageComponent>;
  let scanService: ScanService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanReferencePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProductsService,
          useValue: {
            loadCatalog: async () => undefined,
            catalog: () => [],
            createProduct: async () => ({ id: 'product-1' }),
            createReference: async () => ({}),
          },
        },
        {
          provide: OffProductThumbService,
          useValue: {
            importFromUrl: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    scanService = TestBed.inject(ScanService);
    fixture = TestBed.createComponent(ScanReferencePageComponent);
  });

  it('shows unknown product banner and prefills barcode', async () => {
    scanService.flowState.set({
      barcode: '3017620422003',
      status: 'off-unknown',
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.statusMessage()).toContain('Produit inconnu');
    expect(fixture.componentInstance.form.controls.barcode.value).toBe('3017620422003');
  });

  it('prefills reference fields from OFF data', async () => {
    scanService.flowState.set({
      barcode: '3017620422003',
      status: 'off-found',
      prefill: {
        barcode: '3017620422003',
        label: 'Nutella',
        brand: 'Ferrero',
        suggestedProductName: 'Nutella',
        kcalPer100g: 539,
        proteinPer100g: 6.3,
        fatPer100g: 30.9,
        carbsPer100g: 57.5,
        ingredients: 'Sucre',
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.label.value).toBe('Nutella');
    expect(fixture.componentInstance.form.controls.kcalPer100g.value).toBe(539);
  });

  it('shows an OFF preview thumbnail when prefill includes an image URL', async () => {
    scanService.flowState.set({
      barcode: '3017620422003',
      status: 'off-found',
      prefill: {
        barcode: '3017620422003',
        label: 'Nutella',
        suggestedProductName: 'Nutella',
        kcalPer100g: 539,
        proteinPer100g: 6.3,
        fatPer100g: 30.9,
        carbsPer100g: 57.5,
        imageUrl: 'https://off.test/nutella.jpg',
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.product-thumb__image') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://off.test/nutella.jpg');
  });

  it('allows submit in existing product mode without newProductName', async () => {
    const productsService = TestBed.inject(ProductsService);
    vi.spyOn(productsService, 'loadCatalog').mockResolvedValue();
    vi.spyOn(productsService, 'catalog').mockReturnValue([
      {
        product: {
          id: 'product-1',
          name: 'Yaourt',
          recommendedStores: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          deletedAt: null,
        },
      },
    ]);

    scanService.flowState.set({
      barcode: '3017620422003',
      status: 'off-unknown',
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      productId: 'product-1',
      store: 'auchan',
      label: 'Yaourt nature',
      kcalPer100g: 60,
      proteinPer100g: 4,
      fatPer100g: 3,
      carbsPer100g: 5,
    });

    expect(fixture.componentInstance.form.invalid).toBe(false);
  });
});
