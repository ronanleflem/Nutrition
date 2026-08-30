import Dexie, { type EntityTable } from 'dexie';

import type { AppSettings } from '../models/app-settings';
import type { PantryItem } from '../models/pantry-item';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';

export const NUTRITION_DB_NAME = 'NutritionDb';
export const NUTRITION_DB_VERSION = 4;

export class NutritionDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>;
  products!: EntityTable<Product, 'id'>;
  productReferences!: EntityTable<ProductReference, 'id'>;
  pantryItems!: EntityTable<PantryItem, 'id'>;

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

    this.version(NUTRITION_DB_VERSION).stores({
      appSettings: 'id',
      products: 'id',
      productReferences: 'id, productId, barcode, nutritionalScore, store',
      pantryItems: 'id, productId, quantityG, updatedAt',
    });
  }
}
