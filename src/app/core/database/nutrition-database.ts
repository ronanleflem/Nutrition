import Dexie, { type EntityTable } from 'dexie';

import type { AppSettings } from '../models/app-settings';
import type { PantryItem } from '../models/pantry-item';
import type { Product } from '../models/product';

export const NUTRITION_DB_NAME = 'NutritionDb';
export const NUTRITION_DB_VERSION = 2;

export class NutritionDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>;
  products!: EntityTable<Product, 'id'>;
  pantryItems!: EntityTable<PantryItem, 'id'>;

  constructor(name = NUTRITION_DB_NAME) {
    super(name);
    this.version(1).stores({
      appSettings: 'id',
    });
    this.version(NUTRITION_DB_VERSION).stores({
      appSettings: 'id',
      products: 'id, name, deletedAt, createdAt, updatedAt',
      pantryItems: 'id, productId, quantityG, updatedAt',
    });
  }
}
