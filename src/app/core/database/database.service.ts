import { Injectable } from '@angular/core';

import {
  APP_SETTINGS_SINGLETON_ID,
  type AppSettings,
  createDefaultAppSettings,
} from '../models/app-settings';
import {
  compareProductCatalogItems,
  type ProductCatalogItem,
} from '../models/product-catalog';
import {
  createProduct,
  isActiveProduct,
  type CreateProductInput,
  type Product,
  type UpdateProductInput,
} from '../models/product';
import {
  compareReferencesByScore,
  createProductReference,
  deriveRecommendedStores,
  isActiveProductReference,
  type CreateProductReferenceInput,
  type ProductReference,
  type UpdateProductReferenceInput,
} from '../models/product-reference';
import { NutritionalScoreService } from '../scoring/nutritional-score.service';
import { NutritionDatabase } from './nutrition-database';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db: NutritionDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private readonly nutritionalScoreService: NutritionalScoreService) {}

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

  async listProductCatalog(): Promise<ProductCatalogItem[]> {
    await this.initialize();

    const products = (await this.db!.products.toArray()).filter(isActiveProduct);
    const references = (await this.db!.productReferences.toArray()).filter(isActiveProductReference);
    const referencesById = new Map(references.map((reference) => [reference.id, reference]));

    const items = products.map((product) => ({
      product,
      preferredReference: product.preferredReferenceId
        ? referencesById.get(product.preferredReferenceId)
        : undefined,
    }));

    return items.sort(compareProductCatalogItems);
  }

  async listActiveProducts(): Promise<Product[]> {
    const catalog = await this.listProductCatalog();
    return catalog.map((item) => item.product);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await this.initialize();

    const product = await this.db!.products.get(id);
    if (!product || !isActiveProduct(product)) {
      return undefined;
    }

    return product;
  }

  async getProductCatalogItem(productId: string): Promise<ProductCatalogItem | undefined> {
    const product = await this.getProduct(productId);
    if (!product) {
      return undefined;
    }

    const preferredReference = product.preferredReferenceId
      ? await this.getProductReference(product.preferredReferenceId)
      : undefined;

    return { product, preferredReference };
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

  async listActiveReferencesByProductId(productId: string): Promise<ProductReference[]> {
    await this.initialize();

    const references = await this.db!.productReferences
      .where('productId')
      .equals(productId)
      .toArray();

    return references.filter(isActiveProductReference).sort(compareReferencesByScore);
  }

  async getProductReference(id: string): Promise<ProductReference | undefined> {
    await this.initialize();

    const reference = await this.db!.productReferences.get(id);
    if (!reference || !isActiveProductReference(reference)) {
      return undefined;
    }

    return reference;
  }

  async createProductReference(input: CreateProductReferenceInput): Promise<ProductReference> {
    await this.initialize();

    const product = await this.getProduct(input.productId);
    if (!product) {
      throw new Error(`Produit introuvable : ${input.productId}`);
    }

    const nutritionalScore = this.nutritionalScoreService.calculate(input);
    const reference = createProductReference(input, nutritionalScore);
    await this.db!.productReferences.put(reference);
    await this.syncProductStoresFromReferences(product.id);

    return reference;
  }

  async updateProductReference(
    id: string,
    input: UpdateProductReferenceInput,
  ): Promise<ProductReference> {
    await this.initialize();

    const existing = await this.db!.productReferences.get(id);
    if (!existing || !isActiveProductReference(existing)) {
      throw new Error(`Référence introuvable : ${id}`);
    }

    const nutritionalScore = this.nutritionalScoreService.calculate(input);
    const updated: ProductReference = {
      ...existing,
      store: input.store,
      label: input.label.trim(),
      brand: input.brand?.trim() || undefined,
      barcode: input.barcode?.trim() || undefined,
      kcalPer100g: input.kcalPer100g,
      proteinPer100g: input.proteinPer100g,
      fatPer100g: input.fatPer100g,
      carbsPer100g: input.carbsPer100g,
      fiberPer100g: input.fiberPer100g,
      saltPer100g: input.saltPer100g,
      ingredients: input.ingredients?.trim() || undefined,
      price: input.price,
      pricePerKg: input.pricePerKg,
      notes: input.notes?.trim() || undefined,
      nutritionalScore,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.productReferences.put(updated);
    await this.syncProductStoresFromReferences(existing.productId);

    return updated;
  }

  async setPreferredReference(productId: string, referenceId: string): Promise<Product> {
    await this.initialize();

    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error(`Produit introuvable : ${productId}`);
    }

    const reference = await this.getProductReference(referenceId);
    if (!reference || reference.productId !== productId) {
      throw new Error(`Référence introuvable pour ce produit : ${referenceId}`);
    }

    const updated: Product = {
      ...product,
      preferredReferenceId: referenceId,
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

  private async syncProductStoresFromReferences(productId: string): Promise<void> {
    const product = await this.db!.products.get(productId);
    if (!product || !isActiveProduct(product)) {
      return;
    }

    const references = await this.listActiveReferencesByProductId(productId);
    const recommendedStores = deriveRecommendedStores(references);

    const updated: Product = {
      ...product,
      recommendedStores,
      updatedAt: new Date().toISOString(),
    };

    if (product.preferredReferenceId) {
      const preferredStillActive = references.some(
        (reference) => reference.id === product.preferredReferenceId,
      );
      if (!preferredStillActive) {
        updated.preferredReferenceId = undefined;
      }
    }

    await this.db!.products.put(updated);
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
