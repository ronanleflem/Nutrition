export interface ProductShortcutTarget {
  kind: 'product';
  productId: string;
  productName: string;
}

export interface RecipeShortcutTarget {
  kind: 'recipe';
  recipeId: string;
  recipeTitle: string;
}

export type ShortcutTarget = ProductShortcutTarget | RecipeShortcutTarget;

export type ContextMenuAction = 'pantry' | 'use-in-recipe' | 'shopping';

export interface ShortcutIngredientOption {
  productId: string;
  productName: string;
  quantityG: number;
}

export type ContextSheet =
  | { name: 'menu'; target: ShortcutTarget }
  | { name: 'pantry'; productId: string; productName: string }
  | { name: 'shopping'; productId: string; productName: string }
  | { name: 'use-in-recipe'; productId: string; productName: string }
  | { name: 'pick-ingredient'; ingredients: ShortcutIngredientOption[] };

export const CONTEXT_SHORTCUT_MESSAGES = {
  productAdded: 'Produit ajouté.',
  recipeCreated: 'Recette créée.',
  ingredientAdded: 'Ingrédient ajouté.',
  itemAdded: 'Article ajouté.',
  itemsAdded: 'Articles ajoutés.',
  emptyVariant: 'Aucun ingrédient dans la variante par défaut.',
} as const;

export const CONTEXT_MENU_ACTIONS = {
  pantry: 'Ajouter au garde-manger',
  useInRecipe: 'Utiliser dans une recette',
  shopping: 'Ajouter à la liste manuelle',
} as const;

export const NEW_RECIPE_FROM_PRODUCT_STEP = 'Préparer.';
export const NEW_RECIPE_FROM_PRODUCT_VARIANT = 'Base';
export const LONG_PRESS_DURATION_MS = 500;
export const LONG_PRESS_MOVE_THRESHOLD_PX = 10;
