import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Dexie from 'dexie';
import { vi } from 'vitest';

import { DatabaseService } from '../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../core/database/nutrition-database.testing';
import { NetworkStatusService } from '../../../core/network/network-status.service';
import { OffApiService } from '../../../core/off-api/off-api.service';
import { ScanService } from './scan.service';

describe('ScanService', () => {
  let service: ScanService;
  let database: DatabaseService;
  let router: Router;
  let offApi: OffApiService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    service = TestBed.inject(ScanService);
    database = TestBed.inject(DatabaseService);
    router = TestBed.inject(Router);
    offApi = TestBed.inject(OffApiService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
    offApi.clearSessionCache();
    vi.restoreAllMocks();
  });

  it('navigates to existing product when barcode matches local reference', async () => {
    const product = await database.createProduct({ name: 'Nutella' });
    await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Nutella pot',
      barcode: '3017620422003',
      kcalPer100g: 539,
      proteinPer100g: 6.3,
      fatPer100g: 30.9,
      carbsPer100g: 57.5,
    });

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.resolveBarcode('3017620422003');

    expect(navigateSpy).toHaveBeenCalledWith(['/products', product.id]);
  });

  it('opens reference form with OFF prefill when product is found', async () => {
    vi.spyOn(offApi, 'lookupProduct').mockResolvedValue({
      status: 'found',
      prefill: {
        barcode: '3017620422003',
        label: 'Nutella',
        kcalPer100g: 539,
        proteinPer100g: 6.3,
        fatPer100g: 30.9,
        carbsPer100g: 57.5,
      },
    });
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.resolveBarcode('3017620422003');

    expect(service.flowState()?.status).toBe('off-found');
    expect(service.flowState()?.prefill?.label).toBe('Nutella');
    expect(navigateSpy).toHaveBeenCalledWith(['/products', 'scan', 'reference']);
  });

  it('opens manual form when offline', async () => {
    const network = TestBed.inject(NetworkStatusService);
    vi.spyOn(network, 'isOnline').mockReturnValue(false);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.resolveBarcode('3017620422003');

    expect(service.flowState()?.status).toBe('offline');
    expect(navigateSpy).toHaveBeenCalledWith(['/products', 'scan', 'reference']);
  });

  it('prompts restore when barcode matches an archived product', async () => {
    const product = await database.createProduct({ name: 'Nutella archivé' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Nutella pot',
      barcode: '3017620422003',
      kcalPer100g: 539,
      proteinPer100g: 6.3,
      fatPer100g: 30.9,
      carbsPer100g: 57.5,
    });
    await database.archiveProduct(product.id);

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.resolveBarcode('3017620422003');

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(service.pendingRestore()?.product.id).toBe(product.id);
    expect(service.pendingRestore()?.reference.id).toBe(reference.id);
  });
});
