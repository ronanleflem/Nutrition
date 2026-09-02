import { inject, Injectable, signal } from '@angular/core';

import { DatabaseService } from '../../database/database.service';
import { ShoppingListService } from '../../../features/shopping-list/services/shopping-list.service';
import {
  CONTEXT_SHORTCUT_MESSAGES,
  type ContextMenuAction,
  type ContextSheet,
  type ShortcutIngredientOption,
  type ShortcutTarget,
} from './context-shortcuts.models';

@Injectable({ providedIn: 'root' })
export class ContextShortcutsService {
  private readonly database = inject(DatabaseService);
  private readonly shopping = inject(ShoppingListService);

  readonly sheet = signal<ContextSheet | null>(null);
  readonly confirmation = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  openMenu(target: ShortcutTarget): void {
    this.actionError.set(null);
    this.confirmation.set(null);
    this.sheet.set({ name: 'menu', target });
  }

  closeSheet(): void {
    this.sheet.set(null);
  }

  async handleMenuAction(action: ContextMenuAction): Promise<void> {
    const current = this.sheet();
    if (current?.name !== 'menu') {
      return;
    }

    const target = current.target;
    this.actionError.set(null);
    this.confirmation.set(null);

    if (target.kind === 'product') {
      if (action === 'pantry') {
        this.sheet.set({
          name: 'pantry',
          productId: target.productId,
          productName: target.productName,
        });
        return;
      }

      if (action === 'use-in-recipe') {
        this.sheet.set({
          name: 'use-in-recipe',
          productId: target.productId,
          productName: target.productName,
        });
        return;
      }

      this.sheet.set({
        name: 'shopping',
        productId: target.productId,
        productName: target.productName,
      });
      return;
    }

    if (action === 'pantry') {
      await this.openRecipePantry(target.recipeId);
      return;
    }

    if (action === 'shopping') {
      try {
        await this.addRecipeToShopping(target.recipeId);
      } catch (error) {
        this.actionError.set(
          error instanceof Error ? error.message : 'Impossible d’ajouter à la liste.',
        );
        this.sheet.set(null);
      }
    }
  }

  onIngredientPicked(ingredient: ShortcutIngredientOption): void {
    this.sheet.set({
      name: 'pantry',
      productId: ingredient.productId,
      productName: ingredient.productName,
    });
  }

  onPantrySaved(): void {
    this.confirmation.set(CONTEXT_SHORTCUT_MESSAGES.productAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onShoppingSaved(): void {
    this.confirmation.set(CONTEXT_SHORTCUT_MESSAGES.itemAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onRecipeCreated(): void {
    this.confirmation.set(CONTEXT_SHORTCUT_MESSAGES.recipeCreated);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onIngredientAppended(): void {
    this.confirmation.set(CONTEXT_SHORTCUT_MESSAGES.ingredientAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  private async openRecipePantry(recipeId: string): Promise<void> {
    const ingredients = await this.defaultVariantIngredients(recipeId);
    if (ingredients.length === 0) {
      this.actionError.set(CONTEXT_SHORTCUT_MESSAGES.emptyVariant);
      this.sheet.set(null);
      return;
    }

    if (ingredients.length === 1) {
      this.sheet.set({
        name: 'pantry',
        productId: ingredients[0].productId,
        productName: ingredients[0].productName,
      });
      return;
    }

    this.sheet.set({ name: 'pick-ingredient', ingredients });
  }

  private async addRecipeToShopping(recipeId: string): Promise<void> {
    const ingredients = await this.defaultVariantIngredients(recipeId);
    if (ingredients.length === 0) {
      this.actionError.set(CONTEXT_SHORTCUT_MESSAGES.emptyVariant);
      this.sheet.set(null);
      return;
    }

    for (const ingredient of ingredients) {
      await this.shopping.addManualItem(ingredient.productId, ingredient.quantityG);
    }

    this.confirmation.set(
      ingredients.length === 1
        ? CONTEXT_SHORTCUT_MESSAGES.itemAdded
        : CONTEXT_SHORTCUT_MESSAGES.itemsAdded,
    );
    this.actionError.set(null);
    this.sheet.set(null);
  }

  private async defaultVariantIngredients(recipeId: string): Promise<ShortcutIngredientOption[]> {
    const detail = await this.database.getRecipeDetail(recipeId);
    if (!detail) {
      throw new Error('Recette introuvable.');
    }

    const variant = detail.variants.find((item) => item.id === detail.recipe.defaultVariantId);
    return (variant?.ingredients ?? []).map((ingredient) => ({
      productId: ingredient.productId,
      productName: ingredient.productName,
      quantityG: ingredient.quantityG,
    }));
  }
}
