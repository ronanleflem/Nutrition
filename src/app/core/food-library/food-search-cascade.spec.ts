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
});
