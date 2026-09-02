import type { CiqualFoodEntry } from './ciqual-library.types';
import type { OpenNutritionFoodEntry } from './opennutrition-library.types';

export type FoodLibrarySource = 'ciqual' | 'opennutrition';

export const FOOD_LIBRARY_SOURCE_LABELS: Record<FoodLibrarySource, string> = {
  ciqual: 'Ciqual',
  opennutrition: 'OpenNutrition',
};

export interface FoodSearchHit {
  source: FoodLibrarySource;
  sourceLabel: string;
  id: string;
  displayName: string;
  subtitle?: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  barcode?: string;
  ciqualEntry?: CiqualFoodEntry;
  openNutritionEntry?: OpenNutritionFoodEntry;
}

export interface FoodSearchSection {
  source: FoodLibrarySource;
  sourceLabel: string;
  hits: FoodSearchHit[];
}

export interface FoodSearchLocalResult {
  sections: FoodSearchSection[];
  durationMs: number;
}
