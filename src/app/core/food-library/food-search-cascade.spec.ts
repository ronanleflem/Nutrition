import { describe, expect, it } from 'vitest';

import type { OffSearchProviderResult } from '../off-api/off-search.types';
import type { FoodRepoSearchProviderResult } from '../foodrepo-api/foodrepo-search.types';
import type { UsdaSearchProviderResult } from '../usda-fdc/usda-search.types';
import { buildCascadeFromLocalAndOnline } from './food-search-cascade';

describe('food-search-cascade', () => {
  it('appends online sections after local sections in cascade order', () => {
    const result = buildCascadeFromLocalAndOnline(
      [],
      {
        sections: [
          {
            source: 'ciqual',
            sourceLabel: 'Ciqual',
            hits: [
              {
                source: 'ciqual',
                sourceLabel: 'Ciqual',
                id: 'ciqual:1',
                displayName: 'Oeuf',
                kcal: 155,
                proteinG: 13,
                fatG: 11,
                carbsG: 1,
                fiberG: 0,
              },
            ],
          },
        ],
        durationMs: 1,
      },
      1,
      {
        included: true,
        durationMs: 2,
        off: {
          status: 'ok',
          hits: [
            {
              source: 'off',
              sourceLabel: 'Open Food Facts',
              id: 'off:1',
              barcode: '123',
              displayName: 'Skyr',
              kcal: 48,
              proteinG: 7,
              fatG: 0.1,
              carbsG: 2.8,
              fiberG: 0,
              prefill: {
                barcode: '123',
                label: 'Skyr',
                kcalPer100g: 48,
                proteinPer100g: 7,
                fatPer100g: 0.1,
                carbsPer100g: 2.8,
              },
            },
          ],
        } satisfies OffSearchProviderResult,
        foodRepo: { status: 'no_api_key', hits: [] } satisfies FoodRepoSearchProviderResult,
        usda: { status: 'no_api_key', hits: [] } satisfies UsdaSearchProviderResult,
      },
    );

    expect(result.sections.map((section) => section.source)).toEqual(['ciqual', 'off']);
    expect(result.onlineSearched).toBe(true);
  });

  it('appends cached online sections when online search is skipped', () => {
    const result = buildCascadeFromLocalAndOnline(
      [],
      { sections: [], durationMs: 1 },
      1,
      {
        included: false,
        cached: {
          off: [
            {
              source: 'off',
              sourceLabel: 'Open Food Facts',
              id: 'off:cached',
              barcode: '999',
              displayName: 'Skyr cache',
              kcal: 48,
              proteinG: 7,
              fatG: 0.1,
              carbsG: 2.8,
              fiberG: 0,
              prefill: {
                barcode: '999',
                label: 'Skyr cache',
                kcalPer100g: 48,
                proteinPer100g: 7,
                fatPer100g: 0.1,
                carbsPer100g: 2.8,
              },
            },
          ],
          foodrepo: [],
          usda: [],
        },
      },
    );

    expect(result.sections.map((section) => section.source)).toEqual(['off']);
    expect(result.onlineSearched).toBe(false);
  });

  it('merges API hits with cached hits and dedupes by id', () => {
    const sharedHit = {
      source: 'off' as const,
      sourceLabel: 'Open Food Facts' as const,
      id: 'off:1',
      barcode: '123',
      displayName: 'Skyr',
      kcal: 48,
      proteinG: 7,
      fatG: 0.1,
      carbsG: 2.8,
      fiberG: 0,
      prefill: {
        barcode: '123',
        label: 'Skyr',
        kcalPer100g: 48,
        proteinPer100g: 7,
        fatPer100g: 0.1,
        carbsPer100g: 2.8,
      },
    };

    const result = buildCascadeFromLocalAndOnline(
      [],
      { sections: [], durationMs: 1 },
      1,
      {
        included: true,
        durationMs: 2,
        off: { status: 'ok', hits: [sharedHit] } satisfies OffSearchProviderResult,
        foodRepo: { status: 'no_api_key', hits: [] } satisfies FoodRepoSearchProviderResult,
        usda: { status: 'no_api_key', hits: [] } satisfies UsdaSearchProviderResult,
        cached: {
          off: [{ ...sharedHit, displayName: 'Skyr cached' }],
          foodrepo: [],
          usda: [],
        },
      },
      5,
    );

    const offSection = result.sections.find((section) => section.source === 'off');
    expect(offSection?.hits).toHaveLength(1);
    expect(offSection?.hits[0]?.displayName).toBe('Skyr');
  });
});
