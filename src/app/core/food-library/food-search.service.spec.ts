import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FoodSearchService } from './food-search.service';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from './food-search.fixtures';
import { FOOD_LIBRARY_CHUNK_PATHS } from './food-library-paths';

describe('FoodSearchService', () => {
  let service: FoodSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FoodSearchService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockLibraryFetch(): void {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith(FOOD_LIBRARY_CHUNK_PATHS.ciqual)) {
        return {
          ok: true,
          json: async () => CIQUAL_FIXTURE_CHUNK,
        } as Response;
      }

      if (url.endsWith(FOOD_LIBRARY_CHUNK_PATHS.opennutrition)) {
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
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
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
});
