import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { FoodRepoSearchProvider } from './foodrepo-search.provider';

describe('FoodRepoSearchProvider', () => {
  let provider: FoodRepoSearchProvider;
  let database: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(FoodRepoSearchProvider);
    database = TestBed.inject(DatabaseService);
    provider.clearSessionCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips queries shorter than 3 characters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await provider.search('sk');

    expect(result.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns no_api_key when FoodRepo key is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await database.updateFoodRepoApiKey(undefined);

    const result = await provider.search('toblerone');

    expect(result.status).toBe('no_api_key');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts to FoodRepo _search with Token header and maps hits', async () => {
    await database.updateFoodRepoApiKey('test-key');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          hits: {
            hits: [
              {
                _source: {
                  barcode: '7613034623804',
                  display_name_translations: { fr: 'Toblerone' },
                  nutrients: {
                    energy_kcal: { per_hundred: 530 },
                    proteins: { per_hundred: 6 },
                    fat: { per_hundred: 30 },
                    carbohydrates: { per_hundred: 58 },
                  },
                },
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await provider.search('toblerone');

    expect(result.status).toBe('ok');
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]?.source).toBe('foodrepo');

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(String(url)).toContain('foodrepo.org/api/v3/products/_search');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      Authorization: 'Token token="test-key"',
      'Content-Type': 'application/vnd.api+json',
    });
  });

  it('returns unauthorized on 401 response', async () => {
    await database.updateFoodRepoApiKey('invalid-key');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));

    const result = await provider.search('toblerone');

    expect(result.status).toBe('unauthorized');
    expect(result.hits).toEqual([]);
  });
});
