export type ShoppingListSource = 'auto' | 'manual';

export interface ShoppingListItem {
  id: string;
  productId: string;
  quantityG: number;
  checked: boolean;
  source: ShoppingListSource;
  createdAt: string;
}

export interface ShoppingListItemWithProduct extends ShoppingListItem {
  productName: string;
  recommendedStores: string[];
}

export interface CreateShoppingListItemInput {
  productId: string;
  quantityG: number;
  source: ShoppingListSource;
  checked?: boolean;
}

export function createShoppingListItem(input: CreateShoppingListItemInput): ShoppingListItem {
  if (!input.productId) {
    throw new Error('Le produit est requis.');
  }

  if (!Number.isFinite(input.quantityG) || input.quantityG <= 0) {
    throw new Error('La quantité doit être supérieure à 0 g.');
  }

  return {
    id: crypto.randomUUID(),
    productId: input.productId,
    quantityG: input.quantityG,
    checked: input.checked ?? false,
    source: input.source,
    createdAt: new Date().toISOString(),
  };
}
