import { describe, expect, it } from 'vitest';

import {
  FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS,
  FOOD_LIBRARY_STARTER_PACK_LABEL,
} from './food-library-starter-pack';

describe('food-library-starter-pack', () => {
  it('exposes a curated list of about 50 Ciqual ids', () => {
    expect(FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS.length).toBeGreaterThanOrEqual(48);
    expect(FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS.length).toBeLessThanOrEqual(55);
    expect(new Set(FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS).size).toBe(
      FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS.length,
    );
  });

  it('uses ciqual-prefixed ids', () => {
    for (const id of FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS) {
      expect(id.startsWith('ciqual-')).toBe(true);
    }
  });

  it('labels the starter pack for the UI', () => {
    expect(FOOD_LIBRARY_STARTER_PACK_LABEL).toContain('50');
  });
});
