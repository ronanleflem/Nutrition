import type { AppSettings } from '../models/app-settings';
import { OffSearchProvider } from '../off-api/off-search.provider';
import { FoodRepoSearchProvider } from '../foodrepo-api/foodrepo-search.provider';
import { UsdaFdcSearchProvider } from '../usda-fdc/usda-search.provider';
import type { FoodSearchCascadeResult, FoodSearchCascadeSection } from './food-search-cascade.types';
import { ONLINE_CASCADE_SOURCES } from './food-search-cascade.types';

export interface OnlineProviderKeyStatuses {
  foodRepoStatus?: FoodSearchCascadeResult['foodRepoStatus'];
  usdaStatus?: FoodSearchCascadeResult['usdaStatus'];
}

/** Key-only probe when live providers were not invoked (manual/offline/cache path). */
export function probeOnlineProviderKeyStatuses(settings: AppSettings): OnlineProviderKeyStatuses {
  return {
    foodRepoStatus: settings.foodRepoApiKey?.trim() ? undefined : 'no_api_key',
    usdaStatus: settings.usdaApiKey?.trim() ? undefined : 'no_api_key',
  };
}

export function hasCachedOnlineSections(sections: FoodSearchCascadeSection[]): boolean {
  return sections.some((section) =>
    (ONLINE_CASCADE_SOURCES as readonly string[]).includes(section.source),
  );
}

export function buildOfflineSearchBanner(hasCachedOnlineSections: boolean): string {
  if (hasCachedOnlineSections) {
    return 'Recherche en ligne indisponible — bibliothèques locales et résultats en cache affichés.';
  }

  return 'Recherche en ligne indisponible — bibliothèques locales uniquement.';
}

export function clearAllOnlineSearchSessionCaches(
  offSearch: OffSearchProvider,
  foodRepoSearch: FoodRepoSearchProvider,
  usdaSearch: UsdaFdcSearchProvider,
): void {
  offSearch.clearSessionCache();
  foodRepoSearch.clearSessionCache();
  usdaSearch.clearSessionCache();
}
