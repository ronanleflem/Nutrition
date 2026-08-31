import { Injectable } from '@angular/core';

import { normalizeBarcodeInput } from '../barcode/ean';

import {
  APP_SETTINGS_SINGLETON_ID,
  type AppSettings,
  createDefaultAppSettings,
} from '../models/app-settings';
import {
  createDefaultMacroGoals,
  MACRO_GOALS_SINGLETON_ID,
  type MacroGoals,
  type UpdateMacroGoalsInput,
} from '../models/macro-goals';
import {
  createMealPlanEntry,
  type CreateMealPlanEntryInput,
  type MealPlanEntry,
  type UpdateMealPlanEntryInput,
} from '../models/meal-plan-entry';
import {
  createPantryItem,
  type PantryItem,
  type PantryItemWithProduct,
} from '../models/pantry-item';
import {
  compareProductCatalogItems,
  type ProductCatalogItem,
} from '../models/product-catalog';
import {
  createProduct,
  isActiveProduct,
  isArchivedProduct,
  type CreateProductInput,
  type Product,
  type UpdateProductInput,
} from '../models/product';
import {
  compareReferencesByScore,
  createProductReference,
  deriveRecommendedStores,
  isActiveProductReference,
  normalizeStoredBarcode,
  type CreateProductReferenceInput,
  type ProductReference,
  type UpdateProductReferenceInput,
} from '../models/product-reference';
import {
  type RecipeDetail,
  type RecipeVariantDetail,
  sortVariantsByOrder,
} from '../models/recipe-detail';
import { createRecipe, type CreateRecipeInput, type Recipe, type UpdateRecipeInput } from '../models/recipe';
import { createRecipeIngredient, type RecipeIngredient } from '../models/recipe-ingredient';
import type { RecipeListItem } from '../models/recipe-list-item';
import { createRecipeVariant } from '../models/recipe-variant';
import { NutritionalScoreService } from '../scoring/nutritional-score.service';
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

export interface CreateRecipeWithFirstVariantInput {
  recipe: CreateRecipeInput;
  variantName: string;
  ingredients: Array<{
    productId: string;
    quantityG: number;
    slotLabel?: string;
  }>;
}

export interface CreateRecipeResult {
  recipe: Recipe;
  variantId: string;
  ingredients: RecipeIngredient[];
}

export interface AddRecipeVariantInput {
  recipeId: string;
  name: string;
  ingredients: Array<{
    productId: string;
    quantityG: number;
    slotLabel?: string;
  }>;
  rating?: number;
}

export interface AddRecipeVariantResult {
  variantId: string;
  ingredients: RecipeIngredient[];
}

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

  async getMacroGoals(): Promise<MacroGoals> {
    await this.initialize();

    const goals = await this.db!.macroGoals.get(MACRO_GOALS_SINGLETON_ID);
    if (!goals) {
      const defaultGoals = createDefaultMacroGoals();
      await this.db!.macroGoals.put(defaultGoals);
      return defaultGoals;
    }

    return goals;
  }

  async updateMacroGoals(input: UpdateMacroGoalsInput): Promise<MacroGoals> {
    await this.initialize();

    const current = await this.getMacroGoals();
    const updated: MacroGoals = { id: MACRO_GOALS_SINGLETON_ID };

    const fields = ['kcal', 'proteinG', 'fatG', 'carbsG', 'fiberG'] as const;
    for (const field of fields) {
      if (field in input) {
        const value = input[field];
        if (value != null) {
          if (value < 0) {
            throw new Error('Les objectifs macros doivent être positifs ou nuls.');
          }
          updated[field] = value;
        }
      } else if (current[field] != null) {
        updated[field] = current[field];
      }
    }

    await this.db!.macroGoals.put(updated);
    return updated;
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

  async getProductIncludingArchived(id: string): Promise<Product | undefined> {
    await this.initialize();

    return (await this.db!.products.get(id)) ?? undefined;
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

  async getActiveReferenceByBarcode(barcode: string): Promise<ProductReference | undefined> {
    await this.initialize();

    const normalized = normalizeBarcodeInput(barcode);
    if (!normalized) {
      return undefined;
    }

    const reference = await this.db!.productReferences.where('barcode').equals(normalized).first();
    if (!reference || !isActiveProductReference(reference)) {
      return undefined;
    }

    return reference;
  }

  async findReferenceByBarcode(
    barcode: string,
  ): Promise<{ reference: ProductReference; product: Product } | undefined> {
    await this.initialize();

    const normalized = normalizeBarcodeInput(barcode);
    if (!normalized) {
      return undefined;
    }

    const reference = await this.db!.productReferences.where('barcode').equals(normalized).first();
    if (!reference || !isActiveProductReference(reference)) {
      return undefined;
    }

    const product = await this.db!.products.get(reference.productId);
    if (!product) {
      return undefined;
    }

    return { reference, product };
  }

  async archiveProduct(id: string): Promise<Product> {
    await this.initialize();

    const existing = await this.db!.products.get(id);
    if (!existing || !isActiveProduct(existing)) {
      throw new Error(`Produit introuvable : ${id}`);
    }

    const updated: Product = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db!.products.put(updated);
    return updated;
  }

  async restoreProduct(id: string): Promise<Product> {
    await this.initialize();

    const existing = await this.db!.products.get(id);
    if (!existing || isActiveProduct(existing)) {
      throw new Error(`Produit archivé introuvable : ${id}`);
    }

    const updated: Product = {
      ...existing,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.products.put(updated);
    return updated;
  }

  async listArchivedProducts(): Promise<Product[]> {
    await this.initialize();

    const products = await this.db!.products.toArray();
    return products
      .filter((product) => !isActiveProduct(product))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }));
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
      barcode: normalizeStoredBarcode(input.barcode),
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

  async listRecipes(): Promise<RecipeListItem[]> {
    await this.initialize();

    const recipes = await this.db!.recipes.orderBy('createdAt').reverse().toArray();
    if (recipes.length === 0) {
      return [];
    }

    const variantIds = recipes.map((recipe) => recipe.defaultVariantId);
    const variants = await this.db!.recipeVariants.bulkGet(variantIds);
    const variantMap = new Map(
      variants.filter((variant) => variant != null).map((variant) => [variant!.id, variant!]),
    );

    const items = recipes.map((recipe) => ({
      recipe,
      defaultVariantName: variantMap.get(recipe.defaultVariantId)?.name ?? 'Variante',
    }));

    return items;
  }

  async getRecipeDetail(recipeId: string): Promise<RecipeDetail | undefined> {
    await this.initialize();

    const recipe = await this.db!.recipes.get(recipeId);
    if (!recipe) {
      return undefined;
    }

    const variants = sortVariantsByOrder(
      await this.db!.recipeVariants.where('recipeId').equals(recipeId).toArray(),
    );
    if (variants.length === 0) {
      return undefined;
    }

    const variantIds = variants.map((variant) => variant.id);
    const allIngredients = await this.db!.recipeIngredients
      .where('variantId')
      .anyOf(variantIds)
      .toArray();

    const productIds = [...new Set(allIngredients.map((ingredient) => ingredient.productId))];
    const products = await this.db!.products.bulkGet(productIds);
    const productMap = new Map(
      products.filter((product): product is Product => product != null).map((product) => [product.id, product]),
    );

    const preferredReferenceIds = [
      ...new Set(
        products
          .filter((product): product is Product => product != null && !!product.preferredReferenceId)
          .map((product) => product.preferredReferenceId!),
      ),
    ];
    const preferredReferences = await this.db!.productReferences.bulkGet(preferredReferenceIds);
    const referenceMap = new Map(
      preferredReferences
        .filter(
          (reference): reference is ProductReference =>
            reference != null && isActiveProductReference(reference),
        )
        .map((reference) => [reference.id, reference]),
    );

    const ingredientsByVariant = new Map<string, RecipeVariantDetail['ingredients']>();
    for (const variant of variants) {
      ingredientsByVariant.set(variant.id, []);
    }

    for (const ingredient of allIngredients) {
      const product = productMap.get(ingredient.productId);
      const preferredReference = product?.preferredReferenceId
        ? referenceMap.get(product.preferredReferenceId)
        : undefined;

      ingredientsByVariant.get(ingredient.variantId)?.push({
        ...ingredient,
        productName: product?.name ?? 'Produit inconnu',
        productArchived: product ? isArchivedProduct(product) : false,
        macrosPer100g: preferredReference
          ? {
              kcalPer100g: preferredReference.kcalPer100g,
              proteinPer100g: preferredReference.proteinPer100g,
              fatPer100g: preferredReference.fatPer100g,
              carbsPer100g: preferredReference.carbsPer100g,
              fiberPer100g: preferredReference.fiberPer100g,
              saltPer100g: preferredReference.saltPer100g,
            }
          : undefined,
      });
    }

    const variantDetails: RecipeVariantDetail[] = variants.map((variant) => ({
      ...variant,
      ingredients: ingredientsByVariant.get(variant.id) ?? [],
    }));

    return { recipe, variants: variantDetails };
  }

  async addRecipeVariant(input: AddRecipeVariantInput): Promise<AddRecipeVariantResult> {
    await this.initialize();

    const recipe = await this.db!.recipes.get(input.recipeId);
    if (!recipe) {
      throw new Error('Recette introuvable.');
    }

    const variantName = input.name.trim();
    if (!variantName) {
      throw new Error('Le nom de la variante est obligatoire.');
    }

    if (input.rating != null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
      throw new Error('La note doit être comprise entre 1 et 5 étoiles.');
    }

    await this.validateRecipeIngredients(input.ingredients);

    const existingVariants = await this.db!.recipeVariants
      .where('recipeId')
      .equals(input.recipeId)
      .toArray();
    const nextSortOrder =
      existingVariants.reduce((max, variant) => Math.max(max, variant.sortOrder ?? 0), 0) + 1;

    const variant = createRecipeVariant({
      recipeId: input.recipeId,
      name: variantName,
      sortOrder: nextSortOrder,
    });
    if (input.rating != null) {
      variant.rating = input.rating;
    }

    const ingredients = input.ingredients.map((ingredient) =>
      createRecipeIngredient({
        variantId: variant.id,
        productId: ingredient.productId,
        quantityG: ingredient.quantityG,
        slotLabel: ingredient.slotLabel,
      }),
    );

    await this.db!.transaction('rw', this.db!.recipeVariants, this.db!.recipeIngredients, async () => {
      await this.db!.recipeVariants.put(variant);
      await this.db!.recipeIngredients.bulkPut(ingredients);
    });

    return { variantId: variant.id, ingredients };
  }

  async updateVariantRating(variantId: string, rating: number | null): Promise<void> {
    await this.initialize();

    const variant = await this.db!.recipeVariants.get(variantId);
    if (!variant) {
      throw new Error('Variante introuvable.');
    }

    if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new Error('La note doit être comprise entre 1 et 5 étoiles.');
    }

    const updated = {
      ...variant,
      rating: rating ?? undefined,
    };

    if (rating == null) {
      delete updated.rating;
    }

    await this.db!.recipeVariants.put(updated);
  }

  async setDefaultVariant(recipeId: string, variantId: string): Promise<Recipe> {
    await this.initialize();

    const recipe = await this.db!.recipes.get(recipeId);
    if (!recipe) {
      throw new Error('Recette introuvable.');
    }

    const variant = await this.db!.recipeVariants.get(variantId);
    if (!variant || variant.recipeId !== recipeId) {
      throw new Error('Variante introuvable pour cette recette.');
    }

    const updated: Recipe = {
      ...recipe,
      defaultVariantId: variantId,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.recipes.put(updated);
    return updated;
  }

  async createRecipeWithFirstVariant(
    input: CreateRecipeWithFirstVariantInput,
  ): Promise<CreateRecipeResult> {
    await this.initialize();

    const title = input.recipe.title.trim();
    if (!title) {
      throw new Error('Le titre de la recette est obligatoire.');
    }

    const steps = input.recipe.steps.map((step) => step.trim()).filter(Boolean);
    if (steps.length === 0) {
      throw new Error('Au moins une étape est requise.');
    }

    if (!Number.isFinite(input.recipe.defaultPortions) || input.recipe.defaultPortions <= 0) {
      throw new Error('Le nombre de portions doit être supérieur à 0.');
    }

    const durationMin = this.normalizeDurationMin(input.recipe.durationMin);

    const variantName = input.variantName.trim();
    if (!variantName) {
      throw new Error('Le nom de la variante est obligatoire.');
    }

    if (input.ingredients.length === 0) {
      throw new Error('Au moins un ingrédient est requis.');
    }

    await this.validateRecipeIngredients(input.ingredients);

    const recipeId = crypto.randomUUID();
    const variant = createRecipeVariant({
      recipeId,
      name: variantName,
    });
    const recipe = createRecipe(
      {
        ...input.recipe,
        title,
        steps,
        durationMin,
      },
      variant.id,
    );
    recipe.id = recipeId;

    const ingredients = input.ingredients.map((ingredient) =>
      createRecipeIngredient({
        variantId: variant.id,
        productId: ingredient.productId,
        quantityG: ingredient.quantityG,
        slotLabel: ingredient.slotLabel,
      }),
    );

    await this.db!.transaction('rw', this.db!.recipes, this.db!.recipeVariants, this.db!.recipeIngredients, async () => {
      await this.db!.recipes.put(recipe);
      await this.db!.recipeVariants.put(variant);
      await this.db!.recipeIngredients.bulkPut(ingredients);
    });

    return { recipe, variantId: variant.id, ingredients };
  }

  async updateRecipe(recipeId: string, input: UpdateRecipeInput): Promise<Recipe> {
    await this.initialize();

    const existing = await this.db!.recipes.get(recipeId);
    if (!existing) {
      throw new Error('Recette introuvable.');
    }

    const title = input.title.trim();
    if (!title) {
      throw new Error('Le titre de la recette est obligatoire.');
    }

    const steps = input.steps.map((step) => step.trim()).filter(Boolean);
    if (steps.length === 0) {
      throw new Error('Au moins une étape est requise.');
    }

    if (!Number.isFinite(input.defaultPortions) || input.defaultPortions <= 0) {
      throw new Error('Le nombre de portions doit être supérieur à 0.');
    }

    const durationMin = this.normalizeDurationMin(input.durationMin);

    const updated: Recipe = {
      ...existing,
      title,
      steps,
      durationMin,
      defaultPortions: input.defaultPortions,
      tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
      notes: input.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await this.db!.recipes.put(updated);
    return updated;
  }

  async countMealPlanEntriesForRecipe(recipeId: string): Promise<number> {
    await this.initialize();
    return this.db!.mealPlanEntries.where('recipeId').equals(recipeId).count();
  }

  async listMealPlanEntriesByDate(date: string): Promise<MealPlanEntry[]> {
    await this.initialize();

    const entries = await this.db!.mealPlanEntries.where('date').equals(date).toArray();
    const slotOrder: Record<MealPlanEntry['slot'], number> = {
      breakfast: 0,
      lunch: 1,
      dinner: 2,
    };

    return entries.sort((left, right) => slotOrder[left.slot] - slotOrder[right.slot]);
  }

  async listMealPlanEntriesBetweenDates(startDate: string, endDate: string): Promise<MealPlanEntry[]> {
    await this.initialize();

    const entries = await this.db!.mealPlanEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();

    return entries.sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const slotOrder: Record<MealPlanEntry['slot'], number> = {
        breakfast: 0,
        lunch: 1,
        dinner: 2,
      };

      return slotOrder[left.slot] - slotOrder[right.slot];
    });
  }

  async getMealPlanEntryByDateAndSlot(
    date: string,
    slot: MealPlanEntry['slot'],
  ): Promise<MealPlanEntry | undefined> {
    await this.initialize();

    return this.db!.mealPlanEntries.where({ date, slot }).first();
  }

  async createMealPlanEntry(input: CreateMealPlanEntryInput): Promise<MealPlanEntry> {
    await this.initialize();

    const recipe = await this.db!.recipes.get(input.recipeId);
    if (!recipe) {
      throw new Error('Recette introuvable.');
    }

    const existing = await this.getMealPlanEntryByDateAndSlot(input.date, input.slot);
    if (existing) {
      throw new Error('Un repas est déjà planifié pour ce créneau.');
    }

    const entry = createMealPlanEntry(input);
    await this.db!.mealPlanEntries.put(entry);
    return entry;
  }

  async updateMealPlanEntry(
    entryId: string,
    input: UpdateMealPlanEntryInput,
  ): Promise<MealPlanEntry> {
    await this.initialize();

    const existing = await this.db!.mealPlanEntries.get(entryId);
    if (!existing) {
      throw new Error('Entrée de plan introuvable.');
    }

    const recipe = await this.db!.recipes.get(input.recipeId);
    if (!recipe) {
      throw new Error('Recette introuvable.');
    }

    const updated: MealPlanEntry = {
      ...existing,
      recipeId: input.recipeId,
      recipeVariantId:
        input.recipeVariantId === null || input.recipeVariantId === undefined
          ? undefined
          : input.recipeVariantId,
    };

    await this.db!.mealPlanEntries.put(updated);
    return updated;
  }

  async updateMealPlanEntryVariant(
    entryId: string,
    recipeVariantId: string,
  ): Promise<MealPlanEntry> {
    await this.initialize();

    const existing = await this.db!.mealPlanEntries.get(entryId);
    if (!existing) {
      throw new Error('Entrée de plan introuvable.');
    }

    const variant = await this.db!.recipeVariants.get(recipeVariantId);
    if (!variant || variant.recipeId !== existing.recipeId) {
      throw new Error('Variante introuvable pour cette recette.');
    }

    const updated: MealPlanEntry = {
      ...existing,
      recipeVariantId,
    };

    await this.db!.mealPlanEntries.put(updated);
    return updated;
  }

  async deleteMealPlanEntry(entryId: string): Promise<void> {
    await this.initialize();
    await this.db!.mealPlanEntries.delete(entryId);
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    await this.initialize();

    const recipe = await this.db!.recipes.get(recipeId);
    if (!recipe) {
      throw new Error('Recette introuvable.');
    }

    const variants = await this.db!.recipeVariants.where('recipeId').equals(recipeId).toArray();
    const variantIds = variants.map((variant) => variant.id);

    await this.db!.transaction(
      'rw',
      this.db!.recipes,
      this.db!.recipeVariants,
      this.db!.recipeIngredients,
      this.db!.mealPlanEntries,
      async () => {
        await this.db!.mealPlanEntries.where('recipeId').equals(recipeId).delete();
        if (variantIds.length > 0) {
          await this.db!.recipeIngredients.where('variantId').anyOf(variantIds).delete();
        }
        await this.db!.recipeVariants.where('recipeId').equals(recipeId).delete();
        await this.db!.recipes.delete(recipeId);
      },
    );
  }

  /** Test helper to reset in-memory state after closing the Dexie connection. */
  async closeForTests(): Promise<void> {
    if (this.db) {
      this.db.close();
    }

    this.db = null;
    this.initPromise = null;
  }

  private normalizeDurationMin(value: number | undefined): number | undefined {
    if (value == null) {
      return undefined;
    }

    if (!Number.isFinite(value) || value < 1) {
      throw new Error('La durée doit être un nombre entier supérieur ou égal à 1 minute.');
    }

    return Math.floor(value);
  }

  private async validateRecipeIngredients(
    ingredients: Array<{ productId: string; quantityG: number }>,
  ): Promise<void> {
    if (ingredients.length === 0) {
      throw new Error('Au moins un ingrédient est requis.');
    }

    for (const ingredient of ingredients) {
      if (!Number.isFinite(ingredient.quantityG) || ingredient.quantityG <= 0) {
        throw new Error('Chaque ingrédient doit avoir une quantité en grammes supérieure à 0.');
      }

      const product = await this.getProduct(ingredient.productId);
      if (!product) {
        throw new Error('Produit introuvable ou archivé.');
      }

      if (!product.preferredReferenceId) {
        throw new Error(
          `Le produit « ${product.name} » n'a pas de référence préférée. Définissez-en une avant d'ajouter l'ingrédient.`,
        );
      }
    }
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

    const existingGoals = await db.macroGoals.get(MACRO_GOALS_SINGLETON_ID);
    if (!existingGoals) {
      await db.macroGoals.put(createDefaultMacroGoals());
    }

    this.db = db;
  }
}
