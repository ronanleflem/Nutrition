/** Embedded food-library asset paths (relative to site root). */

export const FOOD_LIBRARY_BASE_PATH = 'assets/food-library';

export const FOOD_LIBRARY_MANIFEST_PATH = `${FOOD_LIBRARY_BASE_PATH}/manifest.json`;

export interface FoodLibraryManifest {
  ciqual: string;
  opennutrition: string;
}

export function foodLibraryChunkPath(filename: string): string {
  return `${FOOD_LIBRARY_BASE_PATH}/${filename}`;
}
