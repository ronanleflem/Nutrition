import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { SearchCacheService } from './search-cache.service';
import {
  matchesSearchCacheQuery,
  mergeOnlineHits,
  toSearchCacheEntry,
} from './search-cache.utils';

describe('search-cache helpers', () => {
  it('mergeOnlineHits dedupes by id and prefers primary order', () => {
    const primary = [
      {
        source: 'off' as const,
        sourceLabel: 'Open Food Facts' as const,
        id: 'off:1',
        barcode: '1',
        displayName: 'A',
        kcal: 1,
        proteinG: 1,
        fatG: 1,
        carbsG: 1,
        fiberG: 0,
        prefill: { barcode: '1', label: 'A', kcalPer100g: 1, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 },
      },
    ];
    const secondary = [
      {
        ...primary[0],
        displayName: 'A cached',
      },
      {
        source: 'off' as const,
        sourceLabel: 'Open Food Facts' as const,
        id: 'off:2',
        barcode: '2',
        displayName: 'B',
        kcal: 2,
        proteinG: 2,
        fatG: 2,
        carbsG: 2,
        fiberG: 0,
        prefill: { barcode: '2', label: 'B', kcalPer100g: 2, proteinPer100g: 2, fatPer100g: 2, carbsPer100g: 2 },
      },
    ];

    expect(mergeOnlineHits(primary, secondary, 5).map((hit) => hit.id)).toEqual(['off:1', 'off:2']);
  });

  it('matchesSearchCacheQuery matches display name and stored query', () => {
    const entry = toSearchCacheEntry('skyr danone', {
      source: 'off',
      sourceLabel: 'Open Food Facts',
      id: 'off:1',
      barcode: '1',
      displayName: 'Skyr nature',
      kcal: 48,
      proteinG: 7,
      fatG: 0,
      carbsG: 2,
      fiberG: 0,
      prefill: { barcode: '1', label: 'Skyr', kcalPer100g: 48, proteinPer100g: 7, fatPer100g: 0, carbsPer100g: 2 },
    });

    expect(matchesSearchCacheQuery(entry, 'skyr')).toBe(true);
    expect(matchesSearchCacheQuery(entry, 'danone')).toBe(true);
    expect(matchesSearchCacheQuery(entry, 'inexistant')).toBe(false);
  });
});

describe('SearchCacheService', () => {
  let service: SearchCacheService;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchCacheService);
    database = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('stores and retrieves matching hits with 30-entry cap', async () => {
    await service.rememberSuccessfulHits('skyr danone', [
      {
        source: 'off',
        sourceLabel: 'Open Food Facts',
        id: 'off:3033490004743',
        barcode: '3033490004743',
        displayName: 'Skyr',
        kcal: 48,
        proteinG: 7,
        fatG: 0.1,
        carbsG: 2.8,
        fiberG: 0,
        prefill: {
          barcode: '3033490004743',
          label: 'Skyr',
          kcalPer100g: 48,
          proteinPer100g: 7,
          fatPer100g: 0.1,
          carbsPer100g: 2.8,
        },
      },
    ]);

    const cached = await service.findMatchingHits('skyr');
    expect(cached.off).toHaveLength(1);
    expect(cached.off[0]?.barcode).toBe('3033490004743');
    expect(await service.countEntries()).toBe(1);
  });

  it('clearHistory removes all entries', async () => {
    await service.rememberSuccessfulHits('oeuf', [
      {
        source: 'usda',
        sourceLabel: 'USDA',
        id: 'usda:173944',
        fdcId: 173944,
        displayName: 'Egg',
        kcal: 143,
        proteinG: 12.6,
        fatG: 9.5,
        carbsG: 0.7,
        fiberG: 0,
        prefill: {
          barcode: '',
          label: 'Egg',
          kcalPer100g: 143,
          proteinPer100g: 12.6,
          fatPer100g: 9.5,
          carbsPer100g: 0.7,
        },
        cacheEntry: {
          fdcId: 173944,
          description: 'Egg',
          kcalPer100g: 143,
          proteinPer100g: 12.6,
          fatPer100g: 9.5,
          carbsPer100g: 0.7,
          cachedAt: new Date().toISOString(),
        },
      },
    ]);

    await service.clearHistory();
    expect(await service.countEntries()).toBe(0);
    expect((await service.findMatchingHits('oeuf')).usda).toEqual([]);
  });
});
