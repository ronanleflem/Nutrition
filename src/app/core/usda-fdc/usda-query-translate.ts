export type FrEnFoodAliases = Record<string, string>;

export async function loadFrEnFoodAliases(url: string): Promise<FrEnFoodAliases> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as FrEnFoodAliases;
    return payload ?? {};
  } catch {
    return {};
  }
}

export function translateUsdaSearchQuery(query: string, aliases: FrEnFoodAliases): string {
  const trimmed = query.trim();
  if (!trimmed || Object.keys(aliases).length === 0) {
    return trimmed;
  }

  let translated = trimmed;
  const keys = Object.keys(aliases).sort((left, right) => right.length - left.length);

  for (const key of keys) {
    const pattern = new RegExp(escapeRegExp(key), 'gi');
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, aliases[key] ?? key);
    }
  }

  return translated.trim() || trimmed;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
