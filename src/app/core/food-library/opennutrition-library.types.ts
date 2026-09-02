/** Shared types for OpenNutrition offline food library chunk (build + runtime). */

export type OpenNutritionLibrarySource = 'opennutrition';

export type OpenNutritionFoodType = 'everyday' | 'grocery' | 'prepared' | 'restaurant';

export interface OpenNutritionFoodEntry {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  type: OpenNutritionFoodType;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
}

export interface OpenNutritionFoodLibraryManifest {
  libraryVersion: string;
  source: OpenNutritionLibrarySource;
  generatedAt: string;
  entryCount: number;
}

export interface OpenNutritionFoodLibraryChunk extends OpenNutritionFoodLibraryManifest {
  entries: OpenNutritionFoodEntry[];
}
