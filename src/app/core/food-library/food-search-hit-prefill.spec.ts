import { describe, expect, it } from 'vitest';

import type { FoodSearchHit } from './food-search.types';
import { foodSearchHitToPrefill } from './food-search-hit-prefill';
import { toOpenNutritionHit } from './food-search-index';
import { OPENNUTRITION_FIXTURE_CHUNK } from './food-search.fixtures';

describe('foodSearchHitToPrefill', () => {
  it('maps OpenNutrition hits to reference prefill', () => {
    const hit = toOpenNutritionHit(OPENNUTRITION_FIXTURE_CHUNK.entries[0]);
    const prefill = foodSearchHitToPrefill(hit, '3560070467394');

    expect(prefill).toMatchObject({
      barcode: '3560070467394',
      brand: 'Danone',
      suggestedProductName: 'Skyr Nature',
      kcalPer100g: 63,
    });
  });

  it('maps generic hits using display name', () => {
    const hit = {
      source: 'ciqual',
      sourceLabel: 'Ciqual',
      id: 'ciqual-1',
      displayName: 'Œuf, cru',
      kcal: 143,
      proteinG: 13,
      fatG: 10,
      carbsG: 1,
      fiberG: 0,
    } satisfies FoodSearchHit;

    expect(foodSearchHitToPrefill(hit, '1234567890123').label).toBe('Œuf, cru');
  });
});
