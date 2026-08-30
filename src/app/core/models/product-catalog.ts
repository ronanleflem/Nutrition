import type { Product } from './product';
import type { ProductReference } from './product-reference';
import { compareReferencesByScore } from './product-reference';

export interface ProductCatalogItem {
  product: Product;
  preferredReference?: ProductReference;
}

export function compareProductCatalogItems(a: ProductCatalogItem, b: ProductCatalogItem): number {
  const scoreA = a.preferredReference?.nutritionalScore ?? -1;
  const scoreB = b.preferredReference?.nutritionalScore ?? -1;

  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  return a.product.name.localeCompare(b.product.name, 'fr', { sensitivity: 'base' });
}

export function getPrimaryStoreLabel(item: ProductCatalogItem): string | undefined {
  return item.preferredReference?.store;
}

export function getDisplayScore(item: ProductCatalogItem): number | undefined {
  return item.preferredReference?.nutritionalScore;
}

export function sortReferencesForDisplay(references: ProductReference[]): ProductReference[] {
  return [...references].sort(compareReferencesByScore);
}
