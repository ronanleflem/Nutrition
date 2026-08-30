export interface RecipeIngredient {
  id: string;
  variantId: string;
  productId: string;
  quantityG: number;
  slotLabel?: string;
}

export interface CreateRecipeIngredientInput {
  variantId: string;
  productId: string;
  quantityG: number;
  slotLabel?: string;
}

export function createRecipeIngredient(input: CreateRecipeIngredientInput): RecipeIngredient {
  return {
    id: crypto.randomUUID(),
    variantId: input.variantId,
    productId: input.productId,
    quantityG: input.quantityG,
    slotLabel: input.slotLabel?.trim() || undefined,
  };
}
