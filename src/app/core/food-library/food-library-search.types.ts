import type { FoodRepoSearchHit } from '../foodrepo-api/foodrepo-search.types';
import type { OffSearchHit } from '../off-api/off-search.types';
import type { UsdaSearchHit } from '../usda-fdc/usda-search.types';
import type { FoodSearchHit, FoodSearchSection } from './food-search.types';
import type {
  FoodSearchCascadeHit,
  FoodSearchCascadeResult,
  FoodSearchCascadeSection,
} from './food-search-cascade.types';

export type OnlineSearchHit = OffSearchHit | FoodRepoSearchHit | UsdaSearchHit;

export type FoodLibrarySearchHit = FoodSearchHit | OnlineSearchHit;

export interface FoodLibrarySearchSection {
  source: FoodSearchHit['source'] | OnlineSearchHit['source'];
  sourceLabel: string;
  hits: FoodLibrarySearchHit[];
}

export type FoodLibraryPageSearchResult = Omit<FoodSearchCascadeResult, 'sections'> & {
  sections: FoodLibrarySearchSection[];
};

export function isOffSearchHit(hit: FoodLibrarySearchHit): hit is OffSearchHit {
  return hit.source === 'off';
}

export function isFoodRepoSearchHit(hit: FoodLibrarySearchHit): hit is FoodRepoSearchHit {
  return hit.source === 'foodrepo';
}

export function isUsdaSearchHit(hit: FoodLibrarySearchHit): hit is UsdaSearchHit {
  return hit.source === 'usda';
}

export function isOnlineSearchHit(hit: FoodSearchCascadeHit): hit is OnlineSearchHit {
  return hit.source === 'off' || hit.source === 'foodrepo' || hit.source === 'usda';
}

export function isLibrarySearchHit(hit: FoodSearchCascadeHit): hit is FoodSearchHit {
  return hit.source === 'ciqual' || hit.source === 'opennutrition';
}

export type { FoodSearchSection };
