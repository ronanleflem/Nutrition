import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import { ProductsService } from '../../../products/services/products.service';
import { RecipesService } from '../../services/recipes.service';
import { IngredientProductPickerSheetComponent } from '../ingredient-product-picker-sheet/ingredient-product-picker-sheet.component';

@Component({
  selector: 'app-recipe-form-page',
  imports: [ReactiveFormsModule, RouterLink, IngredientProductPickerSheetComponent],
  templateUrl: './recipe-form-page.component.html',
  styleUrl: './recipe-form-page.component.scss',
})
export class RecipeFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly recipesService = inject(RecipesService);
  readonly productsService = inject(ProductsService);

  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly ingredientError = signal<string | null>(null);
  readonly blockedProduct = signal<Product | null>(null);
  readonly pickerIngredientIndex = signal<number | null>(null);
  private onboardingRecipeCreated = false;
  private createdRecipeId: string | null = null;

  readonly eligibleProducts = computed(() =>
    this.productsService.catalog().filter((item) => !!item.product.preferredReferenceId),
  );

  readonly cancelLink = computed(() =>
    this.route.snapshot.queryParamMap.get('from') === 'onboarding' ? '/onboarding' : '/recipes',
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

  async ngOnInit(): Promise<void> {
    await this.productsService.loadCatalog();
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const defaultPortions = Number(raw.defaultPortions);
    if (!Number.isFinite(defaultPortions) || defaultPortions < 1) {
      this.submitError.set('Le nombre de portions doit être supérieur à 0.');
      return;
    }

    const durationMin = raw.durationMin ? Number(raw.durationMin) : undefined;
    if (durationMin != null && (!Number.isFinite(durationMin) || durationMin < 1)) {
      this.submitError.set('La durée doit être un nombre supérieur ou égal à 1 minute.');
      return;
    }

    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.saving.set(true);
    this.submitError.set(null);

    const fromOnboarding = this.route.snapshot.queryParamMap.get('from') === 'onboarding';

    try {
      if (fromOnboarding && this.onboardingRecipeCreated && this.createdRecipeId) {
        await this.router.navigate(['/recipes', this.createdRecipeId, 'photo-prompt'], {
          queryParams: { from: 'onboarding' },
        });
        return;
      }

      const result = await this.recipesService.createRecipeWithFirstVariant({
        recipe: {
          title: raw.title,
          steps: raw.steps,
          durationMin,
          defaultPortions,
          tags: tags.length > 0 ? tags : undefined,
          notes: raw.notes || undefined,
        },
        variantName: raw.variantName,
        ingredients: raw.ingredients.map((ingredient) => ({
          productId: ingredient.productId,
          quantityG: Number(ingredient.quantityG),
          slotLabel: ingredient.slotLabel || undefined,
        })),
      });

      this.createdRecipeId = result.recipe.id;

      if (fromOnboarding) {
        this.onboardingRecipeCreated = true;
        await this.router.navigate(['/recipes', result.recipe.id, 'photo-prompt'], {
          queryParams: { from: 'onboarding' },
        });
        return;
      }

      await this.router.navigate(['/recipes', result.recipe.id, 'photo-prompt']);
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Impossible de créer la recette.');
    } finally {
      this.saving.set(false);
    }
  }
}
