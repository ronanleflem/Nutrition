import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkStatusService } from '../network/network-status.service';
import { FoodSearchService } from './food-search.service';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from './food-search.fixtures';
import { FOOD_LIBRARY_MANIFEST_PATH } from './food-library-paths';

const MANIFEST = {
  ciqual: 'ciqual-v2025.json',
  opennutrition: 'opennutrition-v2025.1.json',
};

describe('FoodSearchService', () => {
  let service: FoodSearchService;
  let onlineSignal = signal(true);

  beforeEach(() => {
    onlineSignal = signal(true);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NetworkStatusService,
          useValue: { isOnline: onlineSignal.asReadonly() },
        },
      ],
    });
    service = TestBed.inject(FoodSearchService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockLibraryFetch(offSearchResponse?: unknown): void {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('search.openfoodfacts.org/search')) {
        return {
          ok: true,
          json: async () =>
            offSearchResponse ?? {
              hits: [
                {
                  code: '3033490004743',
                  product_name_fr: 'Skyr',
                  brands: ['Danone'],
                  nutriments: {
                    'energy-kcal_100g': 48,
                    proteins_100g: 7,
                    fat_100g: 0.1,
                    carbohydrates_100g: 2.8,
                  },
                },
              ],
            },
        } as Response;
      }

      if (url.endsWith(FOOD_LIBRARY_MANIFEST_PATH) || url.endsWith('manifest.json')) {
        return {
          ok: true,
          json: async () => MANIFEST,
        } as Response;
      }

      if (url.includes(MANIFEST.ciqual)) {
        return {
          ok: true,
          json: async () => CIQUAL_FIXTURE_CHUNK,
        } as Response;
      }

      if (url.includes(MANIFEST.opennutrition)) {
        return {
          ok: true,
          json: async () => OPENNUTRITION_FIXTURE_CHUNK,
        } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });
  }

  it('lazy-loads library chunks on first search', async () => {
    mockLibraryFetch();

    expect(service.loaded()).toBe(false);
    await service.searchLocal('oeuf');
    expect(service.loaded()).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('returns grouped local results without network calls after load', async () => {
    mockLibraryFetch();

    const result = await service.searchLocal('skyr');

    expect(result.sections.map((section) => section.source)).toEqual([
      'ciqual',
      'opennutrition',
    ]);
    expect(result.durationMs).toBeLessThan(100);

    vi.mocked(globalThis.fetch).mockClear();
    await service.searchLocal('riz');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('searches barcode offline via OpenNutrition', async () => {
    mockLibraryFetch();

    const hit = await service.searchByBarcode('3560070467394');

    expect(hit).toMatchObject({
      source: 'opennutrition',
      sourceLabel: 'OpenNutrition',
      barcode: '3560070467394',
    });
  });

  it('surfaces load errors when chunks are missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(service.searchLocal('oeuf')).rejects.toThrow(/introuvable/i);
    expect(service.loadError()).toMatch(/introuvable/i);
  });

  it('searchForIngredientPicker prepends catalogue before library sections', async () => {
    mockLibraryFetch();

    const result = await service.searchForIngredientPicker(
      [
        {
          product: {
            id: 'prod-oeuf',
            name: 'Œuf',
            preferredReferenceId: 'ref-1',
            recommendedStores: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          preferredReference: {
            id: 'ref-1',
            productId: 'prod-oeuf',
            store: 'other',
            label: 'Générique',
            nutritionalScore: 70,
            kcalPer100g: 143,
            proteinPer100g: 13,
            fatPer100g: 10,
            carbsPer100g: 0.7,
            fiberPer100g: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ],
      'oeuf',
    );

    expect(result.sections.map((section) => section.source)).toEqual(['catalog', 'ciqual']);
    expect(result.sections[0]?.hits[0]).toMatchObject({
      source: 'catalog',
      productId: 'prod-oeuf',
      displayName: 'Œuf',
    });
  });

  it('searchLibraryPage appends OFF section when online', async () => {
    mockLibraryFetch();
    onlineSignal.set(true);

    const result = await service.searchLibraryPage('skyr danone');

    expect(result.sections.map((section) => section.source)).toContain('off');
    expect(result.offStatus).toBe('ok');
    expect(result.sections.find((section) => section.source === 'off')?.hits[0]).toMatchObject({
      source: 'off',
      barcode: '3033490004743',
    });
  });

  it('searchLibraryPage skips OFF when offline', async () => {
    mockLibraryFetch();
    onlineSignal.set(false);

    const result = await service.searchLibraryPage('skyr danone');

    expect(result.sections.every((section) => section.source !== 'off')).toBe(true);
    expect(result.offStatus).toBeUndefined();
    expect(
      vi
        .mocked(globalThis.fetch)
        .mock.calls.some((call) => String(call[0]).includes('search.openfoodfacts.org')),
    ).toBe(false);
  });
});
