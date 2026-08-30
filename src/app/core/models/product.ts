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
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  category?: string;
  priority?: ProductPriority;
  notes?: string;
}

export interface UpdateProductInput {
  name: string;
  category?: string;
  priority?: ProductPriority | null;
  notes?: string;
}

export function createProduct(input: CreateProductInput): Product {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    category: input.category?.trim() || undefined,
    priority: input.priority,
    notes: input.notes?.trim() || undefined,
    recommendedStores: [],
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isActiveProduct(product: Product): boolean {
  return product.deletedAt == null;
}

export function isArchivedProduct(product: Product): boolean {
  return product.deletedAt != null;
}

/** @deprecated Use compareProductCatalogItems from product-catalog.ts */
export function compareProductsForDisplay(a: Product, b: Product): number {
  return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
}

export const PRODUCT_PRIORITY_LABELS: Record<ProductPriority, string> = {
  green: 'Priorité verte',
  yellow: 'Priorité jaune',
  gray: 'Priorité grise',
};
