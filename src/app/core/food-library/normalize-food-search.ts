/** Accent-insensitive, locale-aware normalization for offline food search. */

export function normalizeFoodSearchText(text: string): string {
  return text
    .toLocaleLowerCase('fr')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function tokenizeFoodSearchQuery(query: string): string[] {
  return normalizeFoodSearchText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function matchesFoodSearchQuery(searchText: string, query: string): boolean {
  const tokens = tokenizeFoodSearchQuery(query);
  if (tokens.length === 0) {
    return false;
  }

  return tokens.every((token) => searchText.includes(token));
}
