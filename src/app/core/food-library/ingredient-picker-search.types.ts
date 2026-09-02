import type { FoodSearchHit, FoodSearchSection } from './food-search.types';

export type IngredientSearchSource = 'catalog' | FoodSearchSection['source'];

export const INGREDIENT_CATALOG_SOURCE_LABEL = 'Mon catalogue';

export interface CatalogSearchHit {
  source: 'catalog';
  sourceLabel: typeof INGREDIENT_CATALOG_SOURCE_LABEL;
  id: string;
  productId: string;
  displayName: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
}

export type IngredientSearchHit = CatalogSearchHit | FoodSearchHit;

export interface IngredientSearchSection {
  source: IngredientSearchSource;
  sourceLabel: string;
  hits: IngredientSearchHit[];
}

export interface IngredientPickerSearchResult {
  sections: IngredientSearchSection[];
  durationMs: number;
}
