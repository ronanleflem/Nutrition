import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import { ProductsService } from '../../../products/services/products.service';
import { RecipesService } from '../../services/recipes.service';

@Component({
  selector: 'app-recipe-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-form-page.component.html',
  styleUrl: './recipe-form-page.component.scss',
})
export class RecipeFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly productsService = inject(ProductsService);

  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly ingredientError = signal<string | null>(null);
  readonly blockedProduct = signal<Product | null>(null);

  readonly eligibleProducts = computed(() =>
    this.productsService.catalog().filter((item) => !!item.product.preferredReferenceId),
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    durationMin: [''],
    defaultPortions: [2, [Validators.required, Validators.min(1)]],
    tags: [''],
    notes: [''],
    variantName: ['Classique', [Validators.required, Validators.pattern(/\S/)]],
    steps: this.fb.nonNullable.array([
      this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/)]),
    ]),
    ingredients: this.fb.nonNullable.array([
      this.fb.nonNullable.group({
        productId: ['', Validators.required],
        quantityG: [100, [Validators.required, Validators.min(1)]],
        slotLabel: [''],
      }),
    ]),
  });

  ngOnInit(): void {
    void this.productsService.loadCatalog();
  }

  get steps(): FormArray {
    return this.form.controls.steps;
  }

  get ingredients(): FormArray {
    return this.form.controls.ingredients;
  }

  addStep(): void {
    this.steps.push(this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/)]));
  }

  removeStep(index: number): void {
    if (this.steps.length <= 1) {
      return;
    }
    this.steps.removeAt(index);
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.saving.set(true);
    this.submitError.set(null);

    try {
      await this.recipesService.createRecipeWithFirstVariant({
        recipe: {
          title: raw.title,
          steps: raw.steps,
          durationMin: raw.durationMin ? Number(raw.durationMin) : undefined,
          defaultPortions: raw.defaultPortions,
          tags: tags.length > 0 ? tags : undefined,
          notes: raw.notes || undefined,
        },
        variantName: raw.variantName,
        ingredients: raw.ingredients.map((ingredient) => ({
          productId: ingredient.productId,
          quantityG: ingredient.quantityG,
          slotLabel: ingredient.slotLabel || undefined,
        })),
      });

      await this.router.navigate(['/recipes']);
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Impossible de créer la recette.');
    } finally {
      this.saving.set(false);
    }
  }
}
