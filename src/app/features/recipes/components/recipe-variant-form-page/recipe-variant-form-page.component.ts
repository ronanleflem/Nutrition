import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import type { Product } from '../../../../core/models/product';
import { ProductsService } from '../../../products/services/products.service';
import { RecipesService } from '../../services/recipes.service';
import { IngredientProductPickerSheetComponent } from '../ingredient-product-picker-sheet/ingredient-product-picker-sheet.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-recipe-variant-form-page',
  imports: [ReactiveFormsModule, RouterLink, StarRatingComponent, IngredientProductPickerSheetComponent],
  templateUrl: './recipe-variant-form-page.component.html',
  styleUrl: './recipe-variant-form-page.component.scss',
})
export class RecipeVariantFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  readonly productsService = inject(ProductsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly ingredientError = signal<string | null>(null);
  readonly blockedProduct = signal<Product | null>(null);
  readonly pickerIngredientIndex = signal<number | null>(null);
  readonly rating = signal<number | undefined>(undefined);

  readonly eligibleProducts = computed(() =>
    this.productsService.catalog().filter((item) => !!item.product.preferredReferenceId),
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    ingredients: this.fb.nonNullable.array([
      this.fb.nonNullable.group({
        productId: ['', Validators.required],
        quantityG: [100, [Validators.required, Validators.min(1)]],
        slotLabel: [''],
      }),
    ]),
  });

  readonly recipeId = signal<string | null>(null);

  ngOnInit(): void {
    void this.productsService.loadCatalog();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.recipeId.set(id);
          if (!id) {
            void this.router.navigate(['/recipes']);
            return of(null);
          }

          return from(this.loadRecipe(id));
        }),
      )
      .subscribe();
  }

  get ingredients(): FormArray {
    return this.form.controls.ingredients;
  }

  async loadRecipe(recipeId: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const detail = await this.recipesService.getRecipeDetail(recipeId);
      if (!detail) {
        this.loadError.set('Recette introuvable.');
        return;
      }
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Impossible de charger la recette.');
    } finally {
      this.loading.set(false);
    }
  }

  addIngredient(): void {
    this.ingredients.push(
      this.fb.nonNullable.group({
        productId: ['', Validators.required],
        quantityG: [100, [Validators.required, Validators.min(1)]],
        slotLabel: [''],
      }),
    );
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length <= 1) {
      return;
    }
    this.ingredients.removeAt(index);
  }

  onProductChange(index: number): void {
    const productId = this.ingredients.at(index).get('productId')?.value;
    if (!productId) {
      this.ingredientError.set(null);
      this.blockedProduct.set(null);
      return;
    }

    const item = this.productsService.catalog().find((entry) => entry.product.id === productId);
    if (!item) {
      this.ingredientError.set('Produit introuvable dans le catalogue.');
      this.blockedProduct.set(null);
      this.ingredients.at(index).patchValue({ productId: '' });
      return;
    }

    if (!item.product.preferredReferenceId) {
      this.blockedProduct.set(item.product);
      this.ingredientError.set(
        `Le produit « ${item.product.name} » n'a pas de référence préférée. Définissez-en une avant d'ajouter l'ingrédient.`,
      );
      this.ingredients.at(index).patchValue({ productId: '' });
      return;
    }

    this.ingredientError.set(null);
    this.blockedProduct.set(null);
  }

  openIngredientPicker(index: number): void {
    this.pickerIngredientIndex.set(index);
  }

  closeIngredientPicker(): void {
    this.pickerIngredientIndex.set(null);
  }

  onIngredientProductSelected(productId: string): void {
    const index = this.pickerIngredientIndex();
    if (index === null) {
      return;
    }

    this.ingredients.at(index).patchValue({ productId });
    this.ingredients.at(index).get('productId')?.markAsTouched();
    this.onProductChange(index);
    this.closeIngredientPicker();
  }

  productDisplayName(productId: string): string {
    const item = this.productsService.catalog().find((entry) => entry.product.id === productId);
    return item?.product.name ?? 'Produit sélectionné';
  }

  onRatingChange(value: number | null): void {
    this.rating.set(value ?? undefined);
  }

  async onSubmit(): Promise<void> {
    const recipeId = this.recipeId();
    if (!recipeId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set(null);

    try {
      await this.recipesService.addRecipeVariant({
        recipeId,
        name: raw.name,
        rating: this.rating(),
        ingredients: raw.ingredients.map((ingredient) => ({
          productId: ingredient.productId,
          quantityG: Number(ingredient.quantityG),
          slotLabel: ingredient.slotLabel || undefined,
        })),
      });

      await this.router.navigate(['/recipes', recipeId]);
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Impossible d’ajouter la variante.');
    } finally {
      this.saving.set(false);
    }
  }
}
