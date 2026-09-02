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

  private generation = 0;
  private inflight = false;
  private confirmationTimer: ReturnType<typeof setTimeout> | null = null;

  openMenu(target: ShortcutTarget): void {
    this.generation += 1;
    this.actionError.set(null);
    this.clearConfirmation();
    this.sheet.set({ name: 'menu', target });
  }

  closeSheet(): void {
    this.generation += 1;
    this.sheet.set(null);
  }

  reset(): void {
    this.generation += 1;
    this.inflight = false;
    this.sheet.set(null);
    this.actionError.set(null);
    this.clearConfirmation();
  }

  async handleMenuAction(action: ContextMenuAction): Promise<void> {
    const current = this.sheet();
    if (current?.name !== 'menu' || this.inflight) {
      return;
    }

    const target = current.target;
    const token = this.generation;
    this.actionError.set(null);
    this.clearConfirmation();

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

    this.inflight = true;
    try {
      if (action === 'pantry') {
        await this.openRecipePantry(target.recipeId);
      } else if (action === 'shopping') {
        await this.addRecipeToShopping(target.recipeId);
      }
    } catch (error) {
      if (token !== this.generation) {
        return;
      }
      this.actionError.set(
        error instanceof Error ? error.message : 'Impossible d’ouvrir le raccourci.',
      );
      this.sheet.set(null);
    } finally {
      this.inflight = false;
    }
  }

  onIngredientPicked(ingredient: ShortcutIngredientOption): void {
    this.sheet.set({
      name: 'pantry',
      productId: ingredient.productId,
      productName: ingredient.productName,
      quantityG: ingredient.quantityG,
    });
  }

  onPantrySaved(): void {
    this.setConfirmation(CONTEXT_SHORTCUT_MESSAGES.productAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onShoppingSaved(): void {
    this.setConfirmation(CONTEXT_SHORTCUT_MESSAGES.itemAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onRecipeCreated(): void {
    this.setConfirmation(CONTEXT_SHORTCUT_MESSAGES.recipeCreated);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  onIngredientAppended(): void {
    this.setConfirmation(CONTEXT_SHORTCUT_MESSAGES.ingredientAdded);
    this.actionError.set(null);
    this.sheet.set(null);
  }

  private async openRecipePantry(recipeId: string): Promise<void> {
    const token = this.generation;
    const ingredients = await this.defaultVariantIngredients(recipeId);
    if (token !== this.generation) {
      return;
    }

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
        quantityG: ingredients[0].quantityG,
      });
      return;
    }

    this.sheet.set({ name: 'pick-ingredient', ingredients });
  }

  private async addRecipeToShopping(recipeId: string): Promise<void> {
    const token = this.generation;
    const ingredients = await this.defaultVariantIngredients(recipeId);
    if (token !== this.generation) {
      return;
    }

    if (ingredients.length === 0) {
      this.actionError.set(CONTEXT_SHORTCUT_MESSAGES.emptyVariant);
      this.sheet.set(null);
      return;
    }

    for (const ingredient of ingredients) {
      await this.shopping.addManualItem(ingredient.productId, ingredient.quantityG);
      if (token !== this.generation) {
        return;
      }
    }

    this.setConfirmation(
      ingredients.length === 1
        ? CONTEXT_SHORTCUT_MESSAGES.itemAdded
        : CONTEXT_SHORTCUT_MESSAGES.itemsAdded,
    );
    this.actionError.set(null);
    this.sheet.set(null);
  }

  private setConfirmation(message: string): void {
    this.clearConfirmation();
    this.confirmation.set(message);
    this.confirmationTimer = setTimeout(() => {
      this.confirmation.set(null);
      this.confirmationTimer = null;
    }, 4000);
  }

  private clearConfirmation(): void {
    if (this.confirmationTimer != null) {
      clearTimeout(this.confirmationTimer);
      this.confirmationTimer = null;
    }
    this.confirmation.set(null);
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
