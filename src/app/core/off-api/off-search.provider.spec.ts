import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OffSearchProvider } from './off-search.provider';

describe('OffSearchProvider', () => {
  let provider: OffSearchProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(OffSearchProvider);
    provider.clearSessionCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips queries shorter than 3 characters', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await provider.search('sk');

    expect(result.status).toBe('skipped');
    expect(result.hits).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls Search-a-licious with langs=fr and maps hits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          hits: [
            {
              code: '3033490004743',
              product_name_fr: 'Skyr',
              brands: ['Danone'],
              nutriments: {
                'energy-kcal_100g': 48,
                proteins_100g: 7.14,
                fat_100g: 0.14,
                carbohydrates_100g: 2.79,
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await provider.search('skyr danone');

    expect(result.status).toBe('ok');
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]?.source).toBe('off');
    expect(result.hits[0]?.barcode).toBe('3033490004743');
    expect(result.hits[0]?.displayName).toBe('Skyr');
    expect(result.hits[0]?.prefill.brand).toBe('Danone');

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]?.[0];
    expect(String(fetchCall)).toContain('search.openfoodfacts.org/search');
    expect(String(fetchCall)).toContain('langs=fr');
    expect(String(fetchCall)).toContain('q=skyr');
  });

  it('returns rate_limited after 10 requests in the same minute', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ hits: [] }), { status: 200 }),
    );

    for (let index = 0; index < 10; index++) {
      await provider.search(`query-${index}`);
    }

    const limited = await provider.search('skyr danone');

    expect(limited.status).toBe('rate_limited');
    expect(limited.hits).toEqual([]);
    expect(limited.msUntilRetry).toBeGreaterThan(0);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(10);
  });

  it('returns network_error on failed fetch without caching the failure', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ hits: [] }), { status: 200 }));

    const first = await provider.search('skyr danone');
    expect(first.status).toBe('network_error');

    const second = await provider.search('skyr danone');
    expect(second.status).toBe('ok');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('maps HTTP 429 to rate_limited', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 429 }));

    const result = await provider.search('skyr danone');

    expect(result.status).toBe('rate_limited');
    expect(result.hits).toEqual([]);
  });

  it('reuses session cache for identical queries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ hits: [] }), { status: 200 }),
    );

    await provider.search('skyr danone');
    await provider.search('skyr danone');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
