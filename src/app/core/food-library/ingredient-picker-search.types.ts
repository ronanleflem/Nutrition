import type {
  FoodSearchCascadeHit,
  FoodSearchCascadeResult,
  FoodSearchCascadeSection,
  FoodSearchCascadeSource,
} from './food-search-cascade.types';

export type IngredientSearchSource = FoodSearchCascadeSource;

export const INGREDIENT_CATALOG_SOURCE_LABEL = 'Mon catalogue';

export interface CatalogSearchHit {
  source: 'catalog';
  sourceLabel: typeof INGREDIENT_CATALOG_SOURCE_LABEL;
  id: string;
  productId: string;
  displayName: string;
  category?: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
}

export type IngredientSearchHit = FoodSearchCascadeHit;

export type IngredientSearchSection = FoodSearchCascadeSection;

export type IngredientPickerSearchResult = FoodSearchCascadeResult;
