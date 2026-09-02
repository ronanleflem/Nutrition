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
import { mergeOnlineHits, type CachedOnlineHitsBySource } from './search-cache.utils';

export function buildCascadeFromLocalAndOnline(
  catalogHits: CatalogSearchHit[],
  localResult: FoodSearchLocalResult,
  localDurationMs: number,
  online:
    | {
        included: false;
        cached?: CachedOnlineHitsBySource;
      }
    | {
        included: true;
        durationMs: number;
        off: OffSearchProviderResult;
        foodRepo: FoodRepoSearchProviderResult;
        usda: UsdaSearchProviderResult;
        cached?: CachedOnlineHitsBySource;
      },
  limitPerSection = 25,
): FoodSearchCascadeResult {
  const sections = mergeIngredientPickerSections(catalogHits, localResult);

  if (online.included) {
    appendOnlineSections(sections, online.off, online.foodRepo, online.usda, online.cached, limitPerSection);
  } else if (online.cached) {
    appendCachedOnlineSections(sections, online.cached);
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
  cached: CachedOnlineHitsBySource | undefined,
  limitPerSection: number,
): void {
  const offHits = mergeOnlineHits(offResult.hits, cached?.off ?? [], limitPerSection);
  const foodRepoHits = mergeOnlineHits(foodRepoResult.hits, cached?.foodrepo ?? [], limitPerSection);
  const usdaHits = mergeOnlineHits(usdaResult.hits, cached?.usda ?? [], limitPerSection);

  if (offHits.length > 0) {
    sections.push({
      source: 'off',
      sourceLabel: offHits[0]?.sourceLabel ?? 'Open Food Facts',
      hits: offHits,
    });
  }

  if (foodRepoHits.length > 0) {
    sections.push({
      source: 'foodrepo',
      sourceLabel: foodRepoHits[0]?.sourceLabel ?? 'FoodRepo',
      hits: foodRepoHits,
    });
  }

  if (usdaHits.length > 0) {
    sections.push({
      source: 'usda',
      sourceLabel: usdaHits[0]?.sourceLabel ?? 'USDA',
      hits: usdaHits,
    });
  }
}

function appendCachedOnlineSections(
  sections: FoodSearchCascadeSection[],
  cached: CachedOnlineHitsBySource,
): void {
  if (cached.off.length > 0) {
    sections.push({
      source: 'off',
      sourceLabel: cached.off[0]?.sourceLabel ?? 'Open Food Facts',
      hits: cached.off,
    });
  }

  if (cached.foodrepo.length > 0) {
    sections.push({
      source: 'foodrepo',
      sourceLabel: cached.foodrepo[0]?.sourceLabel ?? 'FoodRepo',
      hits: cached.foodrepo,
    });
  }

  if (cached.usda.length > 0) {
    sections.push({
      source: 'usda',
      sourceLabel: cached.usda[0]?.sourceLabel ?? 'USDA',
      hits: cached.usda,
    });
  }
}
