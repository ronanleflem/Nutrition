import type { ProductReferenceMacros } from './product-reference';
import type { Recipe } from './recipe';
import type { RecipeIngredient } from './recipe-ingredient';
import type { RecipeVariant } from './recipe-variant';

export interface RecipeIngredientWithProduct extends RecipeIngredient {
  productName: string;
  productArchived?: boolean;
  macrosPer100g?: ProductReferenceMacros;
}

export interface RecipeVariantDetail extends RecipeVariant {
  ingredients: RecipeIngredientWithProduct[];
}

export interface RecipeDetail {
  recipe: Recipe;
  variants: RecipeVariantDetail[];
}

export function sortVariantsByOrder(variants: RecipeVariant[]): RecipeVariant[] {
  return [...variants].sort((left, right) => {
    const leftOrder = left.sortOrder ?? 0;
    const rightOrder = right.sortOrder ?? 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}
