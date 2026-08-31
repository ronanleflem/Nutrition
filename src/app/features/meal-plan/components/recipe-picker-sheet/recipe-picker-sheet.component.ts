import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DatabaseService } from '../../../../core/database/database.service';
import { formatRecipeMacros } from '../../../../core/models/recipe-macros';
import type { RecipeListItem } from '../../../../core/models/recipe-list-item';
import { RecipeMacroService } from '../../../../core/scoring/recipe-macro.service';
import { EmptyStateComponent } from '../../../products/components/empty-state/empty-state.component';

interface RecipePickerItem {
  item: RecipeListItem;
  macroPreview: string;
}

@Component({
  selector: 'app-recipe-picker-sheet',
  imports: [FormsModule, EmptyStateComponent],
  templateUrl: './recipe-picker-sheet.component.html',
  styleUrl: './recipe-picker-sheet.component.scss',
})
export class RecipePickerSheetComponent {
  private readonly database = inject(DatabaseService);
  private readonly recipeMacroService = inject(RecipeMacroService);

  readonly recipes = input.required<RecipeListItem[]>();
  readonly pageError = input<string | null>(null);
  readonly selected = output<string>();
  readonly closed = output<void>();

  readonly searchQuery = signal('');
  readonly loadingMacros = signal(false);
  readonly macroPreviewByRecipeId = signal<Record<string, string>>({});

  readonly filteredRecipes = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase('fr');
    if (!query) {
      return this.recipes();
    }

    return this.recipes().filter((item) =>
      item.recipe.title.toLocaleLowerCase('fr').includes(query),
    );
  });

  readonly pickerItems = computed<RecipePickerItem[]>(() =>
    this.filteredRecipes().map((item) => ({
      item,
      macroPreview:
        this.macroPreviewByRecipeId()[item.recipe.id] ?? 'Macros en cours de chargement…',
    })),
  );

  readonly hasRecipes = computed(() => this.recipes().length > 0);
  readonly hasResults = computed(() => this.pickerItems().length > 0);

  constructor() {
    effect(() => {
      const recipes = this.recipes();
      if (recipes.length > 0) {
        void this.loadMacroPreviews(recipes);
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  selectRecipe(recipeId: string): void {
    this.selected.emit(recipeId);
  }

  private async loadMacroPreviews(recipes: RecipeListItem[]): Promise<void> {
    this.loadingMacros.set(true);

    try {
      const previews: Record<string, string> = {};

      for (const item of recipes) {
        const detail = await this.database.getRecipeDetail(item.recipe.id);
        if (!detail) {
          previews[item.recipe.id] = 'Macros indisponibles';
          continue;
        }

        const defaultVariant = detail.variants.find(
          (variant) => variant.id === detail.recipe.defaultVariantId,
        );

        if (!defaultVariant) {
          previews[item.recipe.id] = 'Macros indisponibles';
          continue;
        }

        const breakdown = this.recipeMacroService.calculateForVariant(
          defaultVariant,
          detail.recipe.defaultPortions,
        );

        previews[item.recipe.id] = breakdown.incomplete
          ? `${formatRecipeMacros(breakdown.perPortion)} (partiel)`
          : formatRecipeMacros(breakdown.perPortion);
      }

      this.macroPreviewByRecipeId.set(previews);
    } finally {
      this.loadingMacros.set(false);
    }
  }
}
