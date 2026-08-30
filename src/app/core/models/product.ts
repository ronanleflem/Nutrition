export type ProductPriority = 'green' | 'yellow' | 'gray';

export interface Product {
  id: string;
  name: string;
  category?: string;
  priority?: ProductPriority;
  alternativeRemark?: string;
  notes?: string;
  preferredReferenceId?: string;
  recommendedStores: string[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createProduct(name: string): Product {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Le nom du produit est requis.');
  }

  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: trimmed,
    recommendedStores: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function isActiveProduct(product: Product): boolean {
  return product.deletedAt == null;
}
