import Dexie, { type EntityTable } from 'dexie';

import type { AppSettings } from '../models/app-settings';
import type { MacroGoals } from '../models/macro-goals';
import type { MealPlanEntry } from '../models/meal-plan-entry';
import type { PantryItem } from '../models/pantry-item';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';
import type { Recipe } from '../models/recipe';
import type { RecipeIngredient } from '../models/recipe-ingredient';
import type { RecipeVariant } from '../models/recipe-variant';
import type { ShoppingListItem } from '../models/shopping-list-item';
import type { ImageBlob } from '../models/image-blob';
import type { UsdaFoodCacheEntry } from '../models/usda-food-cache';
import type { SearchCacheEntry } from '../models/search-cache-entry';

export const NUTRITION_DB_NAME = 'NutritionDb';
export const NUTRITION_DB_VERSION = 11;

export class NutritionDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>;
  macroGoals!: EntityTable<MacroGoals, 'id'>;
  products!: EntityTable<Product, 'id'>;
  productReferences!: EntityTable<ProductReference, 'id'>;
  pantryItems!: EntityTable<PantryItem, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  recipeVariants!: EntityTable<RecipeVariant, 'id'>;
  recipeIngredients!: EntityTable<RecipeIngredient, 'id'>;
  mealPlanEntries!: EntityTable<MealPlanEntry, 'id'>;
  shoppingListItems!: EntityTable<ShoppingListItem, 'id'>;
  usdaFoodCache!: EntityTable<UsdaFoodCacheEntry, 'fdcId'>;
  searchCache!: EntityTable<SearchCacheEntry, 'id'>;
  imageBlobs!: EntityTable<ImageBlob, 'id'>;

  constructor(name = NUTRITION_DB_NAME) {
    super(name);

    this.version(1).stores({
      appSettings: 'id',
    });

    this.version(2).stores({
      appSettings: 'id',
      products: 'id',
    });

    this.version(3).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
    });

    this.version(4).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
    });

    this.version(5).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
    });

    this.version(6).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
    });

    this.version(7).stores({
      appSettings: 'id',
      macroGoals: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
    });

    this.version(8).stores({
      appSettings: 'id',
      macroGoals: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
      shoppingListItems: 'id, productId, source, checked, createdAt',
    });

    this.version(9).stores({
      appSettings: 'id',
      macroGoals: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
      shoppingListItems: 'id, productId, source, checked, createdAt',
      usdaFoodCache: 'fdcId, cachedAt',
    });

    this.version(10).stores({
      appSettings: 'id',
      macroGoals: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
      shoppingListItems: 'id, productId, source, checked, createdAt',
      usdaFoodCache: 'fdcId, cachedAt',
      searchCache: 'id, source, queryNormalized, cachedAt',
    });

    this.version(NUTRITION_DB_VERSION).stores({
      appSettings: 'id',
      macroGoals: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
      mealPlanEntries: 'id, date, slot, recipeId',
      shoppingListItems: 'id, productId, source, checked, createdAt',
      usdaFoodCache: 'fdcId, cachedAt',
      searchCache: 'id, source, queryNormalized, cachedAt',
      imageBlobs: 'id, mimeType, createdAt',
    });
  }
}
