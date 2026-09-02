import type { FoodRepoSearchProviderResult } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchProviderResult } from '../off-api/off-search.types';
import type { UsdaSearchProviderResult } from '../usda-fdc/usda-search.types';
import type { FoodSearchLocalResult } from './food-search.types';
import type {
  FoodSearchCascadeResult,
  FoodSearchCascadeSection,
} from './food-search-cascade.types';
import type { CatalogSearchHit } from './ingredient-picker-search.types';
import { mergeIngredientPickerSections } from './ingredient-picker-search';

export function buildCascadeFromLocalAndOnline(
  catalogHits: CatalogSearchHit[],
  localResult: FoodSearchLocalResult,
  localDurationMs: number,
  online:
    | {
        included: false;
      }
    | {
        included: true;
        durationMs: number;
        off: OffSearchProviderResult;
        foodRepo: FoodRepoSearchProviderResult;
        usda: UsdaSearchProviderResult;
      },
): FoodSearchCascadeResult {
  const sections = mergeIngredientPickerSections(catalogHits, localResult);

  if (online.included) {
    appendOnlineSections(sections, online.off, online.foodRepo, online.usda);
  }

  return {
    sections,
    durationMs: localDurationMs + (online.included ? online.durationMs : 0),
    onlineSearched: online.included,
    offStatus: online.included ? online.off.status : undefined,
    offMsUntilRetry: online.included ? online.off.msUntilRetry : undefined,
    foodRepoStatus: online.included ? online.foodRepo.status : undefined,
    usdaStatus: online.included ? online.usda.status : undefined,
  };
}

export function buildCascadeFromLocalOnly(
  localResult: FoodSearchLocalResult,
  localDurationMs: number,
): FoodSearchCascadeResult {
  return {
    sections: localResult.sections
      .filter((section) => section.hits.length > 0)
      .map((section) => ({
        source: section.source,
        sourceLabel: section.sourceLabel,
        hits: section.hits,
      })),
    durationMs: localDurationMs,
    onlineSearched: false,
  };
}

function appendOnlineSections(
  sections: FoodSearchCascadeSection[],
  offResult: OffSearchProviderResult,
  foodRepoResult: FoodRepoSearchProviderResult,
  usdaResult: UsdaSearchProviderResult,
): void {
  if (offResult.hits.length > 0) {
    sections.push({
      source: 'off',
      sourceLabel: offResult.hits[0]?.sourceLabel ?? 'Open Food Facts',
      hits: offResult.hits,
    });
  }

  if (foodRepoResult.hits.length > 0) {
    sections.push({
      source: 'foodrepo',
      sourceLabel: foodRepoResult.hits[0]?.sourceLabel ?? 'FoodRepo',
      hits: foodRepoResult.hits,
    });
  }

  if (usdaResult.hits.length > 0) {
    sections.push({
      source: 'usda',
      sourceLabel: usdaResult.hits[0]?.sourceLabel ?? 'USDA',
      hits: usdaResult.hits,
    });
  }
}
