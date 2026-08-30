import { Injectable } from '@angular/core';

import {
  APP_SETTINGS_SINGLETON_ID,
  type AppSettings,
  createDefaultAppSettings,
} from '../models/app-settings';
import {
  createPantryItem,
  type PantryItem,
  type PantryItemWithProduct,
} from '../models/pantry-item';
import {
  createProduct,
  isActiveProduct,
  type Product,
} from '../models/product';
import { NutritionDatabase } from './nutrition-database';

export interface PantryItemInput {
  productId: string;
  quantityG: number;
  expiryDate?: string;
  location?: string;
}

export interface PantryItemUpdate {
  quantityG?: number;
  expiryDate?: string | null;
  location?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db: NutritionDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.openAndSeed();
    }

    await this.initPromise;
  }

  async getAppSettings(): Promise<AppSettings> {
    await this.initialize();

    const settings = await this.db!.appSettings.get(APP_SETTINGS_SINGLETON_ID);
    if (!settings) {
      const defaultSettings = createDefaultAppSettings();
      await this.db!.appSettings.put(defaultSettings);
      return defaultSettings;
    }

    return settings;
  }

  async listActiveProducts(): Promise<Product[]> {
    await this.initialize();

    const products = await this.db!.products.toArray();
    return products
      .filter(isActiveProduct)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  async getProduct(productId: string): Promise<Product | undefined> {
    await this.initialize();
    return this.db!.products.get(productId);
  }

  async createProduct(name: string): Promise<Product> {
    await this.initialize();

    const product = createProduct(name);
    await this.db!.products.put(product);
    return product;
  }

  async listPantryItemsWithProducts(): Promise<PantryItemWithProduct[]> {
    await this.initialize();

    const items = await this.db!.pantryItems.orderBy('updatedAt').reverse().toArray();
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.db!.products.bulkGet(productIds);
    const productMap = new Map(
      products.filter((product): product is Product => product != null).map((p) => [p.id, p]),
    );

    return items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        productName: product?.name ?? 'Produit inconnu',
      };
    });
  }

  async addPantryItem(input: PantryItemInput): Promise<PantryItem> {
    await this.initialize();

    const product = await this.db!.products.get(input.productId);
    if (!product || !isActiveProduct(product)) {
      throw new Error('Produit introuvable ou archivé.');
    }

    const item = createPantryItem(
      input.productId,
      input.quantityG,
      input.expiryDate,
      input.location,
    );
    await this.db!.pantryItems.put(item);
    return item;
  }

  async updatePantryItem(itemId: string, update: PantryItemUpdate): Promise<PantryItem | null> {
    await this.initialize();

    const existing = await this.db!.pantryItems.get(itemId);
    if (!existing) {
      throw new Error('Ligne garde-manger introuvable.');
    }

    if (update.quantityG !== undefined) {
      if (!Number.isFinite(update.quantityG) || update.quantityG <= 0) {
        await this.db!.pantryItems.delete(itemId);
        return null;
      }
    }

    const next: PantryItem = {
      ...existing,
      quantityG: update.quantityG ?? existing.quantityG,
      expiryDate:
        update.expiryDate === null
          ? undefined
          : update.expiryDate !== undefined
            ? update.expiryDate.trim() || undefined
            : existing.expiryDate,
      location:
        update.location === null
          ? undefined
          : update.location !== undefined
            ? update.location.trim() || undefined
            : existing.location,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.pantryItems.put(next);
    return next;
  }

  async deletePantryItem(itemId: string): Promise<void> {
    await this.initialize();
    await this.db!.pantryItems.delete(itemId);
  }

  /** Test helper to reset in-memory state after closing the Dexie connection. */
  async closeForTests(): Promise<void> {
    if (this.db) {
      this.db.close();
    }

    this.db = null;
    this.initPromise = null;
  }

  private async openAndSeed(): Promise<void> {
    const db = new NutritionDatabase();
    await db.open();

    const existing = await db.appSettings.get(APP_SETTINGS_SINGLETON_ID);
    if (!existing) {
      await db.appSettings.put(createDefaultAppSettings());
    }

    this.db = db;
  }
}
