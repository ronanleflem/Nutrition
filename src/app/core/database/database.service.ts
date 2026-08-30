import { Injectable } from '@angular/core';

import {
  APP_SETTINGS_SINGLETON_ID,
  type AppSettings,
  createDefaultAppSettings,
} from '../models/app-settings';
import {
  compareProductsForDisplay,
  createProduct,
  isActiveProduct,
  type CreateProductInput,
  type Product,
  type UpdateProductInput,
} from '../models/product';
import { NutritionDatabase } from './nutrition-database';

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
    return products.filter(isActiveProduct).sort(compareProductsForDisplay);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await this.initialize();

    const product = await this.db!.products.get(id);
    if (!product || !isActiveProduct(product)) {
      return undefined;
    }

    return product;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    await this.initialize();

    const product = createProduct(input);
    await this.db!.products.put(product);
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    await this.initialize();

    const existing = await this.db!.products.get(id);
    if (!existing || !isActiveProduct(existing)) {
      throw new Error(`Produit introuvable : ${id}`);
    }

    const updated: Product = {
      ...existing,
      name: input.name.trim(),
      category: input.category?.trim() || undefined,
      priority: input.priority ?? undefined,
      notes: input.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.products.put(updated);
    return updated;
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
