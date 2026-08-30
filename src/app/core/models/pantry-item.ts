export interface PantryItem {
  id: string;
  productId: string;
  quantityG: number;
  expiryDate?: string;
  location?: string;
  updatedAt: string;
}

export interface PantryItemWithProduct extends PantryItem {
  productName: string;
}

export function createPantryItem(
  productId: string,
  quantityG: number,
  expiryDate?: string,
  location?: string,
): PantryItem {
  if (!productId) {
    throw new Error('Le produit est requis.');
  }
  if (!Number.isFinite(quantityG) || quantityG <= 0) {
    throw new Error('La quantité doit être supérieure à 0 g.');
  }

  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    productId,
    quantityG,
    expiryDate: expiryDate?.trim() || undefined,
    location: location?.trim() || undefined,
    updatedAt: now,
  };
}
