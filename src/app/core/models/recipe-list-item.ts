import type { Recipe } from './recipe';

export interface RecipeListItem {
  recipe: Recipe;
  defaultVariantName: string;
}

export function compareRecipeListItems(left: RecipeListItem, right: RecipeListItem): number {
  return left.recipe.title.localeCompare(right.recipe.title, 'fr', { sensitivity: 'base' });
}
