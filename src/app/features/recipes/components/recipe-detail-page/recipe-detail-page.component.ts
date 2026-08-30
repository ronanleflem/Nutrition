import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { RecipeDetail, RecipeVariantDetail } from '../../../../core/models/recipe-detail';
import { RecipesService } from '../../services/recipes.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { VariantChipRowComponent } from '../variant-chip-row/variant-chip-row.component';

@Component({
  selector: 'app-recipe-detail-page',
  imports: [RouterLink, VariantChipRowComponent, StarRatingComponent],
  templateUrl: './recipe-detail-page.component.html',
  styleUrl: './recipe-detail-page.component.scss',
})
export class RecipeDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);

  readonly detail = signal<RecipeDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selectedVariantId = signal<string | null>(null);
  readonly savingRating = signal(false);
  readonly savingDefault = signal(false);

  readonly activeVariant = computed<RecipeVariantDetail | null>(() => {
    const current = this.detail();
    const selectedId = this.selectedVariantId();
    if (!current || !selectedId) {
      return null;
    }

    return current.variants.find((variant) => variant.id === selectedId) ?? null;
  });

  readonly isDefaultVariant = computed(() => {
    const current = this.detail();
    const active = this.activeVariant();
    return !!current && !!active && current.recipe.defaultVariantId === active.id;
  });

  private recipeId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        void this.router.navigate(['/recipes']);
        return;
      }

      this.recipeId = id;
      void this.loadDetail(id);
    });
  }

  async loadDetail(recipeId: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const detail = await this.recipesService.getRecipeDetail(recipeId);
      if (!detail) {
        this.loadError.set('Recette introuvable.');
        this.detail.set(null);
        return;
      }

      this.detail.set(detail);
      const selected =
        detail.variants.find((variant) => variant.id === detail.recipe.defaultVariantId)?.id ??
        detail.variants[0]?.id ??
        null;
      this.selectedVariantId.set(selected);
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Impossible de charger la recette.');
    } finally {
      this.loading.set(false);
    }
  }

  onVariantSelected(variantId: string): void {
    this.selectedVariantId.set(variantId);
    this.actionError.set(null);
  }

  async onRatingChange(rating: number | null): Promise<void> {
    const active = this.activeVariant();
    if (!active || !this.recipeId) {
      return;
    }

    this.savingRating.set(true);
    this.actionError.set(null);

    try {
      await this.recipesService.updateVariantRating(active.id, rating);
      await this.loadDetail(this.recipeId);
      this.selectedVariantId.set(active.id);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Impossible de mettre à jour la note.');
    } finally {
      this.savingRating.set(false);
    }
  }

  async setAsDefault(): Promise<void> {
    const active = this.activeVariant();
    if (!active || !this.recipeId || this.isDefaultVariant()) {
      return;
    }

    this.savingDefault.set(true);
    this.actionError.set(null);

    try {
      await this.recipesService.setDefaultVariant(this.recipeId, active.id);
      await this.loadDetail(this.recipeId);
      this.selectedVariantId.set(active.id);
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : 'Impossible de définir la variante par défaut.',
      );
    } finally {
      this.savingDefault.set(false);
    }
  }
}
