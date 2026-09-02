import type { FoodSearchCascadeResult } from './food-search-cascade.types';

export function buildOffCascadeMessage(
  status: FoodSearchCascadeResult['offStatus'],
  msUntilRetry?: number,
): string | null {
  if (status === 'rate_limited' && msUntilRetry != null) {
    const seconds = Math.ceil(msUntilRetry / 1000);
    return `Trop de recherches Open Food Facts — réessayez dans ${seconds} s.`;
  }

  if (status === 'network_error') {
    return 'Recherche Open Food Facts indisponible pour le moment.';
  }

  return null;
}

export function buildFoodRepoCascadeMessage(
  status: FoodSearchCascadeResult['foodRepoStatus'],
): string | null {
  if (status === 'no_api_key') {
    return null;
  }

  if (status === 'unauthorized') {
    return null;
  }

  if (status === 'network_error') {
    return 'Recherche FoodRepo indisponible pour le moment.';
  }

  return null;
}

export function buildUsdaCascadeMessage(
  status: FoodSearchCascadeResult['usdaStatus'],
): string | null {
  if (status === 'no_api_key') {
    return null;
  }

  if (status === 'unauthorized') {
    return null;
  }

  if (status === 'network_error') {
    return 'Recherche USDA indisponible pour le moment.';
  }

  return null;
}
