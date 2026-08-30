import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
});
