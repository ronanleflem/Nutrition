import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { FOOD_LIBRARY_CHUNK_PATHS } from './food-library-paths';
import { toCiqualHit, toOpenNutritionHit } from './food-search-index';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from './food-search.fixtures';
import { FoodSearchService } from './food-search.service';
import { FoodLibraryImportService } from './food-library-import.service';
import { GENERIC_REFERENCE_LABEL } from './food-library-import';

describe('FoodLibraryImportService', () => {
  let database: DatabaseService;
  let importService: FoodLibraryImportService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    importService = TestBed.inject(FoodLibraryImportService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('creates product and reference from Ciqual hit', async () => {
    const hit = toCiqualHit(CIQUAL_FIXTURE_CHUNK.entries[0]);
    const result = await importService.importFromLibrary(hit);

    expect(result.status).toBe('created');
    if (result.status !== 'created') {
      return;
    }

    expect(result.product).toMatchObject({
      name: 'Œuf, cru',
      sourceProvider: 'ciqual',
      sourceId: 'ciqual-9001',
    });
    expect(result.reference).toMatchObject({
      label: GENERIC_REFERENCE_LABEL,
      barcode: undefined,
      kcalPer100g: 143,
    });
    expect(result.product.preferredReferenceId).toBe(result.reference.id);
  });

  it('creates OpenNutrition reference with barcode', async () => {
    const hit = toOpenNutritionHit(OPENNUTRITION_FIXTURE_CHUNK.entries[0]);
    const result = await importService.importFromLibrary(hit);

    expect(result.status).toBe('created');
    if (result.status !== 'created') {
      return;
    }

    expect(result.reference.barcode).toBe('3560070467394');
    expect(result.reference.brand).toBe('Danone');
  });

  it('returns duplicate when same source is imported twice', async () => {
    const hit = toCiqualHit(CIQUAL_FIXTURE_CHUNK.entries[0]);
    await importService.importFromLibrary(hit);
    const second = await importService.importFromLibrary(hit);

    expect(second.status).toBe('duplicate');
    if (second.status === 'duplicate') {
      expect(second.match.reason).toBe('source');
    }
  });

  it('can force create despite name duplicate', async () => {
    const hit = toOpenNutritionHit(OPENNUTRITION_FIXTURE_CHUNK.entries[0]);
    const first = await importService.importFromLibrary(hit);
    expect(first.status).toBe('created');

    const forced = await importService.importFromLibrary(hit, { forceCreate: true });
    expect(forced.status).toBe('created');
  });

  it('imports starter pack and skips duplicates on second run', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith(FOOD_LIBRARY_CHUNK_PATHS.ciqual)) {
        return { ok: true, json: async () => CIQUAL_FIXTURE_CHUNK } as Response;
      }
      if (url.endsWith(FOOD_LIBRARY_CHUNK_PATHS.opennutrition)) {
        return { ok: true, json: async () => OPENNUTRITION_FIXTURE_CHUNK } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const foodSearch = TestBed.inject(FoodSearchService);
    await foodSearch.ensureLibrariesLoaded();

    const fixtureIds = CIQUAL_FIXTURE_CHUNK.entries.map((entry) => entry.id);

    const first = await importService.importStarterPack(fixtureIds);
    expect(first.added).toBe(fixtureIds.length);
    expect(first.alreadyPresent).toBe(0);

    const second = await importService.importStarterPack(fixtureIds);
    expect(second.added).toBe(0);
    expect(second.alreadyPresent).toBe(fixtureIds.length);
  });
});
