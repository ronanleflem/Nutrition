import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('references ids that exist in the committed Ciqual chunk', () => {
    const chunkPath = resolve(
      process.cwd(),
      'src/assets/food-library/ciqual-v2025.json',
    );
    const chunk = JSON.parse(readFileSync(chunkPath, 'utf8')) as {
      entries: Array<{ id: string }>;
    };
    const ids = new Set(chunk.entries.map((entry) => entry.id));

    for (const id of FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS) {
      expect(ids.has(id), `missing starter-pack id ${id}`).toBe(true);
    }
  });
});
