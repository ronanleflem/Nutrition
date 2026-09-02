import type { DatabaseService } from '../database/database.service';
import type { NetworkStatusService } from '../network/network-status.service';
import {
  FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH,
  type FoodSearchService,
} from './food-search.service';
import type { FoodSearchCascadeResult } from './food-search-cascade.types';
import type { ProductCatalogItem } from '../models/product-catalog';

export interface FoodSearchCascadeRunOptions {
  query: string;
  catalog?: ProductCatalogItem[];
  forceOnline?: boolean;
  limitPerSection?: number;
  abortSignal?: AbortSignal;
}

export interface FoodSearchCascadeRunOutcome {
  result: FoodSearchCascadeResult;
  preferManualOnlineSearch: boolean;
  canSearchOnline: boolean;
  onlinePending: boolean;
}

export async function resolveIncludeOnline(
  database: DatabaseService,
  networkStatus: NetworkStatusService,
  query: string,
  forceOnline: boolean,
): Promise<{ includeOnline: boolean; preferManualOnlineSearch: boolean; canSearchOnline: boolean }> {
  const settings = await database.getAppSettings();
  const preferManualOnlineSearch = settings.preferManualOnlineSearch === true;
  const trimmed = query.trim();
  const canSearchOnline =
    networkStatus.isOnline() && trimmed.length >= FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH;

  if (!canSearchOnline) {
    return { includeOnline: false, preferManualOnlineSearch, canSearchOnline: false };
  }

  if (preferManualOnlineSearch) {
    return { includeOnline: forceOnline, preferManualOnlineSearch, canSearchOnline: true };
  }

  return { includeOnline: true, preferManualOnlineSearch, canSearchOnline: true };
}

export async function runFoodSearchCascade(
  foodSearch: FoodSearchService,
  database: DatabaseService,
  networkStatus: NetworkStatusService,
  options: FoodSearchCascadeRunOptions,
): Promise<FoodSearchCascadeRunOutcome> {
  const { includeOnline, preferManualOnlineSearch, canSearchOnline } = await resolveIncludeOnline(
    database,
    networkStatus,
    options.query,
    options.forceOnline === true,
  );

  const result = await foodSearch.searchCascade(options.query, {
    catalog: options.catalog,
    limitPerSection: options.limitPerSection,
    includeOnline,
    abortSignal: options.abortSignal,
  });

  return {
    result,
    preferManualOnlineSearch,
    canSearchOnline,
    onlinePending: canSearchOnline && preferManualOnlineSearch && !includeOnline,
  };
}
