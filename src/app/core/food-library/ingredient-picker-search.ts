import type { ProductCatalogItem } from '../models/product-catalog';
import { matchesFoodSearchQuery, normalizeFoodSearchText } from './normalize-food-search';
import type { FoodSearchLocalResult } from './food-search.types';
import {
  INGREDIENT_CATALOG_SOURCE_LABEL,
  type CatalogSearchHit,
  type IngredientPickerSearchResult,
  type IngredientSearchSection,
} from './ingredient-picker-search.types';

const DEFAULT_CATALOG_LIMIT = 25;

export function toCatalogSearchHit(item: ProductCatalogItem): CatalogSearchHit | null {
  const reference = item.preferredReference;
  if (!reference) {
    return null;
  }

  return {
    source: 'catalog',
    sourceLabel: INGREDIENT_CATALOG_SOURCE_LABEL,
    id: `catalog:${item.product.id}`,
    productId: item.product.id,
    displayName: item.product.name,
    subtitle: reference.brand ?? reference.label,
    kcal: reference.kcalPer100g,
    proteinG: reference.proteinPer100g,
    fatG: reference.fatPer100g,
    carbsG: reference.carbsPer100g,
    fiberG: reference.fiberPer100g ?? 0,
  };
}

export function buildCatalogSearchText(item: ProductCatalogItem): string {
  const reference = item.preferredReference;
  const parts = [item.product.name];

  if (reference?.brand) {
    parts.push(reference.brand);
  }

  if (reference?.label) {
    parts.push(reference.label);
  }

  if (reference?.barcode) {
    parts.push(reference.barcode);
  }

  return normalizeFoodSearchText(parts.join(' '));
}

export function searchCatalogForIngredientPicker(
  catalog: ProductCatalogItem[],
  query: string,
  limit = DEFAULT_CATALOG_LIMIT,
): CatalogSearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const eligible = catalog.filter((item) => !!item.product.preferredReferenceId);
  const filtered = eligible.filter((item) =>
    matchesFoodSearchQuery(buildCatalogSearchText(item), trimmed),
  );

  return filtered
    .slice(0, limit)
    .map((item) => toCatalogSearchHit(item))
    .filter((hit): hit is CatalogSearchHit => hit !== null);
}

export function mergeIngredientPickerSections(
  catalogHits: CatalogSearchHit[],
  libraryResult: FoodSearchLocalResult,
): IngredientSearchSection[] {
  const sections: IngredientSearchSection[] = [];

  if (catalogHits.length > 0) {
    sections.push({
      source: 'catalog',
      sourceLabel: INGREDIENT_CATALOG_SOURCE_LABEL,
      hits: catalogHits,
    });
  }

  for (const section of libraryResult.sections) {
    if (section.hits.length > 0) {
      sections.push(section);
    }
  }

  return sections;
}

export function buildIngredientPickerSearchResult(
  catalogHits: CatalogSearchHit[],
  libraryResult: FoodSearchLocalResult,
  catalogDurationMs: number,
): IngredientPickerSearchResult {
  return {
    sections: mergeIngredientPickerSections(catalogHits, libraryResult),
    durationMs: catalogDurationMs + libraryResult.durationMs,
    onlineSearched: false,
  };
}

export function isCatalogSearchHit(hit: { source: string }): hit is CatalogSearchHit {
  return hit.source === 'catalog';
}
