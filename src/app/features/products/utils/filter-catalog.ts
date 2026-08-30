import type { ProductCatalogItem } from '../../../core/models/product-catalog';

function normalizeSearchText(text: string): string {
  return text
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Client-side name filter for catalogue search (NFR-2: instant, no network). */
export function filterCatalogByProductName(
  items: ProductCatalogItem[],
  query: string,
): ProductCatalogItem[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    normalizeSearchText(item.product.name).includes(normalizedQuery),
  );
}
