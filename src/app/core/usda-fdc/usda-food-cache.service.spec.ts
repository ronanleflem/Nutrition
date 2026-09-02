import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { UsdaFoodCacheService } from './usda-food-cache.service';

describe('UsdaFoodCacheService', () => {
  let service: UsdaFoodCacheService;
  let database: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsdaFoodCacheService);
    database = TestBed.inject(DatabaseService);
  });

  it('stores and retrieves USDA food cache entries by fdcId', async () => {
    const entry = {
      fdcId: 173944,
      description: 'Egg, whole, raw, fresh',
      kcalPer100g: 143,
      proteinPer100g: 12.6,
      fatPer100g: 9.5,
      carbsPer100g: 0.7,
      cachedAt: '2026-09-02T00:00:00.000Z',
    };

    await service.put(entry);

    expect(await service.get(173944)).toMatchObject(entry);
    expect(await service.get(999)).toBeUndefined();
  });
});
