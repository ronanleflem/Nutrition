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

export const BACKUP_SCHEMA_VERSION = 2;
export const BACKUP_SCHEMA_VERSION_V1 = 1;
export const BACKUP_APP_ID = 'nutrition';

export interface BackupImageBlobRecord {
  id: string;
  mimeType: string;
  dataBase64: string;
  createdAt: string;
}

export interface BackupData {
  products: Product[];
  productReferences: ProductReference[];
  pantryItems: PantryItem[];
  recipes: Recipe[];
  recipeVariants: RecipeVariant[];
  recipeIngredients: RecipeIngredient[];
  mealPlanEntries: MealPlanEntry[];
  shoppingListItems: ShoppingListItem[];
  macroGoals: MacroGoals[];
  appSettings: AppSettings[];
  imageBlobs: BackupImageBlobRecord[];
}

export interface BackupPayload {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  app: typeof BACKUP_APP_ID;
  data: BackupData;
}

export interface EncryptedBackupEnvelope {
  v: 1;
  salt: string;
  iv: string;
  ciphertext: string;
}

export type ImportMode = 'replace' | 'merge';

export interface ImportSummary {
  mode: ImportMode;
  products: number;
  productReferences: number;
  pantryItems: number;
  recipes: number;
  recipeVariants: number;
  mealPlanEntries: number;
  shoppingListItems: number;
  productsAdded?: number;
  productsUpdated?: number;
  photosRestored?: number;
  photosMissing?: number;
}
