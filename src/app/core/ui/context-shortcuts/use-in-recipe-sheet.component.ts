import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RecipePickerSheetComponent } from '../../../features/meal-plan/components/recipe-picker-sheet/recipe-picker-sheet.component';
import { RecipesService } from '../../../features/recipes/services/recipes.service';
import {
  NEW_RECIPE_FROM_PRODUCT_STEP,
  NEW_RECIPE_FROM_PRODUCT_VARIANT,
} from './context-shortcuts.models';

@Component({
  selector: 'app-use-in-recipe-sheet',
  imports: [ReactiveFormsModule, RecipePickerSheetComponent],
  templateUrl: './use-in-recipe-sheet.component.html',
  styleUrl: './context-shortcuts-sheet.scss',
})
export class UseInRecipeSheetComponent implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly fb = inject(FormBuilder);

  readonly productId = input.required<string>();
  readonly productName = input.required<string>();
  readonly closed = output<void>();
  readonly created = output<void>();
  readonly appended = output<void>();

  readonly recipes = this.recipesService.recipes;
  readonly pickerOpen = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    quantityG: [100, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    void this.recipesService.loadRecipes().catch(() => {
      this.errorMessage.set('Impossible de charger les recettes.');
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  openPicker(): void {
    this.errorMessage.set(null);
    if (!this.ensureQuantity()) {
      return;
    }

    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  async createNewRecipe(): Promise<void> {
    if (!this.ensureQuantity()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.recipesService.createRecipeWithFirstVariant({
        recipe: {
          title: this.productName(),
          steps: [NEW_RECIPE_FROM_PRODUCT_STEP],
          defaultPortions: 1,
        },
        variantName: NEW_RECIPE_FROM_PRODUCT_VARIANT,
        ingredients: [{ productId: this.productId(), quantityG: this.form.getRawValue().quantityG }],
      });
      this.created.emit();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossible de créer la recette.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onRecipeSelected(recipeId: string): Promise<void> {
    if (this.submitting() || !this.ensureQuantity()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.recipesService.appendIngredientToDefaultVariant(recipeId, {
        productId: this.productId(),
        quantityG: this.form.getRawValue().quantityG,
      });
      this.appended.emit();
    } catch (error) {
      this.pickerOpen.set(false);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Impossible d’ajouter l’ingrédient.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private ensureQuantity(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('La quantité doit être supérieure à 0 g.');
      return false;
    }

    return true;
  }
}
