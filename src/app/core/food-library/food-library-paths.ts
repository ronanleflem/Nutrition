/** Embedded food-library chunk paths (relative to site root). */

export const FOOD_LIBRARY_BASE_PATH = 'assets/food-library';

export const FOOD_LIBRARY_CHUNK_PATHS = {
  ciqual: `${FOOD_LIBRARY_BASE_PATH}/ciqual-v2025.json`,
  opennutrition: `${FOOD_LIBRARY_BASE_PATH}/opennutrition-v2025.1.json`,
} as const;
