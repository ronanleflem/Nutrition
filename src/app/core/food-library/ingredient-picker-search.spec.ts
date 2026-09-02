import { describe, expect, it } from 'vitest';

import type { ProductCatalogItem } from '../models/product-catalog';
import {
  buildIngredientPickerSearchResult,
  isCatalogSearchHit,
  mergeIngredientPickerSections,
  searchCatalogForIngredientPicker,
  toCatalogSearchHit,
} from './ingredient-picker-search';
import { INGREDIENT_CATALOG_SOURCE_LABEL } from './ingredient-picker-search.types';

function catalogItem(
  overrides: Partial<ProductCatalogItem['product']> = {},
  refOverrides: Partial<NonNullable<ProductCatalogItem['preferredReference']>> = {},
): ProductCatalogItem {
  const productId = overrides.id ?? 'prod-1';
  return {
    product: {
      id: productId,
      name: overrides.name ?? 'Œuf',
      preferredReferenceId: overrides.preferredReferenceId ?? 'ref-1',
      recommendedStores: overrides.recommendedStores ?? [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    },
    preferredReference: {
      id: 'ref-1',
      productId,
      store: 'other',
      label: 'Générique',
      nutritionalScore: 70,
      kcalPer100g: 143,
      proteinPer100g: 13,
      fatPer100g: 10,
      carbsPer100g: 0.7,
      fiberPer100g: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...refOverrides,
    },
  };
}

describe('ingredient-picker-search', () => {
  it('maps catalog items to search hits with macros', () => {
    const hit = toCatalogSearchHit(catalogItem());

    expect(hit).toMatchObject({
      source: 'catalog',
      sourceLabel: INGREDIENT_CATALOG_SOURCE_LABEL,
      productId: 'prod-1',
      displayName: 'Œuf',
      kcal: 143,
    });
  });

  it('searches catalog with accent-insensitive matching', () => {
    const hits = searchCatalogForIngredientPicker([catalogItem()], 'oeuf');

    expect(hits).toHaveLength(1);
    expect(hits[0]?.displayName).toBe('Œuf');
  });

  it('searches catalog by reference brand', () => {
    const hits = searchCatalogForIngredientPicker(
      [catalogItem({ name: 'Yaourt nature' }, { brand: 'Danone' })],
      'danone',
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.displayName).toBe('Yaourt nature');
  });

  it('merges sections in cascade order: catalogue, ciqual, opennutrition', () => {
    const catalogHits = searchCatalogForIngredientPicker([catalogItem()], 'oeuf');
    const libraryResult = {
      sections: [
        {
          source: 'ciqual' as const,
          sourceLabel: 'Ciqual',
          hits: [
            {
              source: 'ciqual' as const,
              sourceLabel: 'Ciqual',
              id: 'ciqual:1',
              displayName: 'Oeuf, dur',
              kcal: 155,
              proteinG: 13,
              fatG: 11,
              carbsG: 1,
              fiberG: 0,
            },
          ],
        },
        {
          source: 'opennutrition' as const,
          sourceLabel: 'OpenNutrition',
          hits: [
            {
              source: 'opennutrition' as const,
              sourceLabel: 'OpenNutrition',
              id: 'on:1',
              displayName: 'Egg',
              kcal: 140,
              proteinG: 12,
              fatG: 10,
              carbsG: 1,
              fiberG: 0,
            },
          ],
        },
      ],
      durationMs: 2,
    };

    const sections = mergeIngredientPickerSections(catalogHits, libraryResult);

    expect(sections.map((section) => section.source)).toEqual([
      'catalog',
      'ciqual',
      'opennutrition',
    ]);
  });

  it('builds combined search result with total duration', () => {
    const result = buildIngredientPickerSearchResult(
      searchCatalogForIngredientPicker([catalogItem()], 'oeuf'),
      { sections: [], durationMs: 5 },
      3,
    );

    expect(result.durationMs).toBe(8);
    expect(result.sections[0]?.sourceLabel).toBe(INGREDIENT_CATALOG_SOURCE_LABEL);
  });

  it('identifies catalog hits', () => {
    const hit = toCatalogSearchHit(catalogItem());
    expect(hit && isCatalogSearchHit(hit)).toBe(true);
  });
});
