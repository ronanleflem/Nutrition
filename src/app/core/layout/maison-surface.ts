/** Routes « maison visuelle » — thème forêt assumé (bandeaux, vignettes, ambiance). */
const MAISON_PATH_PREFIXES = ['/pantry', '/recipes', '/plan', '/products'] as const;

export function isMaisonSurfaceUrl(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0];
  return MAISON_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
