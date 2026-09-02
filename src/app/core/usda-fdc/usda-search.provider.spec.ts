import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { UsdaFdcSearchProvider } from './usda-search.provider';

describe('UsdaFdcSearchProvider', () => {
  let provider: UsdaFdcSearchProvider;
  let database: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(UsdaFdcSearchProvider);
    database = TestBed.inject(DatabaseService);
    provider.clearSessionCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips queries shorter than 3 characters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await provider.search('oe');

    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns no_api_key when USDA key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await database.updateUsdaApiKey(undefined);

    const result = await provider.search('egg');

    expect(result.status).toBe('no_api_key');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gets USDA search with translated query and maps hits', async () => {
    await database.updateUsdaApiKey('test-key');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/assets/food-library/fr-en-food-aliases.json')) {
        return new Response(JSON.stringify({ œuf: 'egg' }), { status: 200 });
      }

      if (url.includes('api.nal.usda.gov/fdc/v1/foods/search')) {
        expect(url).toContain('query=egg');
        return new Response(
          JSON.stringify({
            foods: [
              {
                fdcId: 173944,
                description: 'Egg, whole, raw, fresh',
                dataType: 'SR Legacy',
                foodNutrients: [
                  { nutrientNumber: '208', value: 143 },
                  { nutrientNumber: '203', value: 12.6 },
                  { nutrientNumber: '204', value: 9.5 },
                  { nutrientNumber: '205', value: 0.7 },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response('{}', { status: 404 });
    });

    const result = await provider.search('œuf');

    expect(result.status).toBe('ok');
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]).toMatchObject({
      source: 'usda',
      fdcId: 173944,
      displayName: 'Egg, whole, raw, fresh',
      kcal: 143,
    });

    const [url] = vi.mocked(globalThis.fetch).mock.calls.find(
      (call) => String(call[0]).includes('api.nal.usda.gov'),
    ) ?? [];
    expect(String(url)).toContain('api_key=test-key');
  });

  it('returns unauthorized on 403 response', async () => {
    await database.updateUsdaApiKey('invalid-key');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 403 }));

    const result = await provider.search('egg');

    expect(result.status).toBe('unauthorized');
    expect(result.hits).toEqual([]);
  });
});
