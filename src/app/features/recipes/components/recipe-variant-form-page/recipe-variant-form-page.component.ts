import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import { ProductsService } from '../../../products/services/products.service';
import { RecipesService } from '../../services/recipes.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-recipe-variant-form-page',
  imports: [ReactiveFormsModule, RouterLink, StarRatingComponent],
  templateUrl: './recipe-variant-form-page.component.html',
  styleUrl: './recipe-variant-form-page.component.scss',
})
export class RecipeVariantFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly productsService = inject(ProductsService);

  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly ingredientError = signal<string | null>(null);
  readonly blockedProduct = signal<Product | null>(null);
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

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.recipeId.set(id);
      if (!id) {
        void this.router.navigate(['/recipes']);
      }
    });
  }

  get ingredients(): FormArray {
    return this.form.controls.ingredients;
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
          quantityG: ingredient.quantityG,
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
