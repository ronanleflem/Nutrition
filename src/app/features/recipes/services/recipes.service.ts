import { inject, Injectable, signal } from '@angular/core';

import type { RecipeDetail } from '../../../core/models/recipe-detail';
import type { RecipeListItem } from '../../../core/models/recipe-list-item';
import type { Recipe } from '../../../core/models/recipe';
import {
  DatabaseService,
  type AddRecipeVariantInput,
  type AddRecipeVariantResult,
  type CreateRecipeWithFirstVariantInput,
  type CreateRecipeResult,
} from '../../../core/database/database.service';

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly database = inject(DatabaseService);

  readonly recipes = signal<RecipeListItem[]>([]);
  readonly loading = signal(false);

  async loadRecipes(): Promise<void> {
    this.loading.set(true);

    try {
      const items = await this.database.listRecipes();
      this.recipes.set(items);
    } finally {
      this.loading.set(false);
    }
  }

  async getRecipeDetail(recipeId: string): Promise<RecipeDetail | undefined> {
    return this.database.getRecipeDetail(recipeId);
  }

  async createRecipeWithFirstVariant(
    input: CreateRecipeWithFirstVariantInput,
  ): Promise<CreateRecipeResult> {
    const result = await this.database.createRecipeWithFirstVariant(input);
    await this.loadRecipes();
    return result;
  }

  async addRecipeVariant(input: AddRecipeVariantInput): Promise<AddRecipeVariantResult> {
    const result = await this.database.addRecipeVariant(input);
    await this.loadRecipes();
    return result;
  }

  async updateVariantRating(variantId: string, rating: number | null): Promise<void> {
    await this.database.updateVariantRating(variantId, rating);
  }

  async setDefaultVariant(recipeId: string, variantId: string): Promise<Recipe> {
    const recipe = await this.database.setDefaultVariant(recipeId, variantId);
    await this.loadRecipes();
    return recipe;
  }
}
