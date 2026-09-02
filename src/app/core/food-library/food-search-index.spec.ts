import { describe, expect, it } from 'vitest';

import { FoodSearchIndex } from './food-search-index';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from './food-search.fixtures';
import { matchesFoodSearchQuery, normalizeFoodSearchText } from './normalize-food-search';

describe('normalize-food-search', () => {
  it('normalizes accents for French queries', () => {
    expect(normalizeFoodSearchText('Œuf')).toBe('oeuf');
    expect(matchesFoodSearchQuery(normalizeFoodSearchText('Œuf, cru'), 'oeuf')).toBe(true);
  });
});

describe('FoodSearchIndex', () => {
  const index = new FoodSearchIndex();

  index.load(CIQUAL_FIXTURE_CHUNK, OPENNUTRITION_FIXTURE_CHUNK);

  it('returns grouped sections in cascade order', () => {
    const sections = index.searchLocal('skyr');

    expect(sections.map((section) => section.source)).toEqual(['ciqual', 'opennutrition']);
    expect(sections[0]?.sourceLabel).toBe('Ciqual');
    expect(sections[1]?.sourceLabel).toBe('OpenNutrition');
  });

  it('finds Ciqual generics by French name', () => {
    const sections = index.searchLocal('riz');
    const ciqualHits = sections.find((section) => section.source === 'ciqual')?.hits ?? [];

    expect(ciqualHits.some((hit) => hit.displayName === 'Riz cuit')).toBe(true);
  });

  it('finds OpenNutrition branded items by brand', () => {
    const sections = index.searchLocal('danone skyr');
    const hits = sections.find((section) => section.source === 'opennutrition')?.hits ?? [];

    expect(hits[0]).toMatchObject({
      source: 'opennutrition',
      sourceLabel: 'OpenNutrition',
      displayName: 'Skyr Nature — Danone',
      barcode: '3560070467394',
    });
  });

  it('looks up barcode offline via OpenNutrition index', () => {
    const hit = index.searchByBarcode('3560070467394');

    expect(hit).toMatchObject({
      source: 'opennutrition',
      barcode: '3560070467394',
      displayName: 'Skyr Nature — Danone',
    });
  });

  it('includes barcode matches in searchLocal results', () => {
    const sections = index.searchLocal('3560070467394');
    const hits = sections.find((section) => section.source === 'opennutrition')?.hits ?? [];

    expect(hits[0]?.barcode).toBe('3560070467394');
  });

  it('searches combined index under 100 ms', () => {
    const largeCiqual = {
      ...CIQUAL_FIXTURE_CHUNK,
      entries: Array.from({ length: 5000 }, (_, index) => ({
        ...CIQUAL_FIXTURE_CHUNK.entries[0],
        id: `ciqual-${index}`,
        nameFr: index % 2 === 0 ? `Œuf variante ${index}` : `Pomme variante ${index}`,
      })),
    };
    const largeOpenNutrition = {
      ...OPENNUTRITION_FIXTURE_CHUNK,
      entries: Array.from({ length: 5000 }, (_, index) => ({
        ...OPENNUTRITION_FIXTURE_CHUNK.entries[0],
        id: `fd_${index}`,
        name: index % 3 === 0 ? `Skyr ${index}` : `Yaourt ${index}`,
        brand: index % 3 === 0 ? 'Danone' : 'Autre',
        barcode: undefined,
      })),
    };

    const perfIndex = new FoodSearchIndex();
    perfIndex.load(largeCiqual, largeOpenNutrition);

    const startedAt = performance.now();
    const sections = perfIndex.searchLocal('danone skyr');
    const durationMs = performance.now() - startedAt;

    expect(sections.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(100);
  });
});
