/** Extrait le libellé catégorie d'un hit de recherche, si disponible. */
export function foodCategoryLabelFromHit(hit: {
  source: string;
  subtitle?: string;
  category?: string;
}): string | undefined {
  if (hit.category?.trim()) {
    return hit.category.trim();
  }

  if (hit.source === 'ciqual' && hit.subtitle?.trim()) {
    return hit.subtitle.trim();
  }

  return undefined;
}
