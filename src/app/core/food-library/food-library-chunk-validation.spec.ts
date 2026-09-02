import { describe, expect, it } from 'vitest';

import { parseCiqualChunk, parseOpenNutritionChunk } from './food-library-chunk-validation';
import { CIQUAL_FIXTURE_CHUNK, OPENNUTRITION_FIXTURE_CHUNK } from './food-search.fixtures';

describe('food-library-chunk-validation', () => {
  it('accepts valid fixture chunks', () => {
    expect(() => parseCiqualChunk(CIQUAL_FIXTURE_CHUNK)).not.toThrow();
    expect(() => parseOpenNutritionChunk(OPENNUTRITION_FIXTURE_CHUNK)).not.toThrow();
  });

  it('rejects chunks with mismatched entryCount', () => {
    expect(() =>
      parseCiqualChunk({
        ...CIQUAL_FIXTURE_CHUNK,
        entryCount: 999,
      }),
    ).toThrow(/entryCount/i);
  });

  it('rejects chunks with wrong source', () => {
    expect(() =>
      parseOpenNutritionChunk({
        ...OPENNUTRITION_FIXTURE_CHUNK,
        source: 'ciqual',
      }),
    ).toThrow(/source attendue/i);
  });
});
