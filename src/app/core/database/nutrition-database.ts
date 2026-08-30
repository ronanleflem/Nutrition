import Dexie, { type EntityTable } from 'dexie';

import type { AppSettings } from '../models/app-settings';
import type { PantryItem } from '../models/pantry-item';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';
import type { Recipe } from '../models/recipe';
import type { RecipeIngredient } from '../models/recipe-ingredient';
import type { RecipeVariant } from '../models/recipe-variant';

export const NUTRITION_DB_NAME = 'NutritionDb';
export const NUTRITION_DB_VERSION = 5;

export class NutritionDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>;
  products!: EntityTable<Product, 'id'>;
  productReferences!: EntityTable<ProductReference, 'id'>;
  pantryItems!: EntityTable<PantryItem, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  recipeVariants!: EntityTable<RecipeVariant, 'id'>;
  recipeIngredients!: EntityTable<RecipeIngredient, 'id'>;

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

    this.version(NUTRITION_DB_VERSION).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
      recipes: 'id, title, defaultVariantId, createdAt',
      recipeVariants: 'id, recipeId',
      recipeIngredients: 'id, variantId, productId',
    });
  }
}
