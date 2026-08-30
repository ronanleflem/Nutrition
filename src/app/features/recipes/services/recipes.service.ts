import { inject, Injectable, signal } from '@angular/core';

import type { RecipeListItem } from '../../../core/models/recipe-list-item';
import {
  DatabaseService,
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

  async createRecipeWithFirstVariant(
    input: CreateRecipeWithFirstVariantInput,
  ): Promise<CreateRecipeResult> {
    const result = await this.database.createRecipeWithFirstVariant(input);
    await this.loadRecipes();
    return result;
  }
}
