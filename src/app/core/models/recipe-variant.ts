export interface RecipeVariant {
  id: string;
  recipeId: string;
  name: string;
  rating?: number;
  notes?: string;
  sortOrder?: number;
  createdAt: string;
}

export interface CreateRecipeVariantInput {
  recipeId: string;
  name: string;
  sortOrder?: number;
}

export function createRecipeVariant(input: CreateRecipeVariantInput): RecipeVariant {
  return {
    id: crypto.randomUUID(),
    recipeId: input.recipeId,
    name: input.name.trim(),
    sortOrder: input.sortOrder ?? 0,
    createdAt: new Date().toISOString(),
  };
}
