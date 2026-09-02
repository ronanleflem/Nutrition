/** USDA FoodData Central API (Phase 3). Not cached by the service worker. */
export const USDA_FDC_API_ORIGIN = 'https://api.nal.usda.gov';

export const USDA_FDC_API_URL_PATTERN = `${USDA_FDC_API_ORIGIN}/**`;

export const USDA_FDC_SEARCH_PATH = '/fdc/v1/foods/search';

export const USDA_FDC_DEFAULT_DATA_TYPES = ['Foundation', 'SR Legacy', 'Branded'] as const;
