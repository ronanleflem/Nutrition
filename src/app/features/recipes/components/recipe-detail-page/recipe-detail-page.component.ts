import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { ContextShortcutsOutletComponent } from '../../../../core/ui/context-shortcuts/context-shortcuts-outlet.component';
import { ContextShortcutsService } from '../../../../core/ui/context-shortcuts/context-shortcuts.service';
import { RECIPE_PHOTO_REPLACE_ERROR } from '../../../../core/images/recipe-photo.messages';
import { RecipePhotoService } from '../../../../core/images/recipe-photo.service';
import { RecipePhotoThumbComponent } from '../../../../core/images/recipe-photo-thumb.component';
import type { RecipeDetail, RecipeVariantDetail } from '../../../../core/models/recipe-detail';
import { RecipeMacroService } from '../../../../core/scoring/recipe-macro.service';
import { RecipesService } from '../../services/recipes.service';
import { RecipeMacrosPanelComponent } from '../recipe-macros-panel/recipe-macros-panel.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { VariantChipRowComponent } from '../variant-chip-row/variant-chip-row.component';

@Component({
  selector: 'app-recipe-detail-page',
  imports: [
    RouterLink,
    VariantChipRowComponent,
    StarRatingComponent,
    RecipeMacrosPanelComponent,
    ConfirmDialogComponent,
    ContextShortcutsOutletComponent,
    RecipePhotoThumbComponent,
  ],
  templateUrl: './recipe-detail-page.component.html',
  styleUrl: './recipe-detail-page.component.scss',
})
export class RecipeDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly recipeMacroService = inject(RecipeMacroService);
  private readonly shortcuts = inject(ContextShortcutsService);
  private readonly recipePhoto = inject(RecipePhotoService);

  readonly detail = signal<RecipeDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selectedVariantId = signal<string | null>(null);
  readonly savingRating = signal(false);
  readonly savingDefault = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly deleting = signal(false);
  readonly planEntryCount = signal(0);
  readonly photoBusy = signal(false);
  readonly showPhotoMenu = signal(false);

  readonly hasPhoto = computed(() => !!this.detail()?.recipe.photoBlobId);

  readonly deleteConfirmMessage = computed(() => {
    const count = this.planEntryCount();
    if (count > 0) {
      return `Cette recette est planifiée ${count} fois. La suppression retirera aussi ces entrées du plan. Continuer ?`;
    }

    return 'Supprimer définitivement cette recette et toutes ses variantes ?';
  });

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

  readonly activeVariantMacros = computed(() => {
    const current = this.detail();
    const active = this.activeVariant();
    if (!current || !active) {
      return null;
    }

    return this.recipeMacroService.calculateForVariant(active, current.recipe.defaultPortions);
  });

  private recipeId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            void this.router.navigate(['/recipes']);
            return of(null);
          }

          this.recipeId = id;
          return from(this.loadDetail(id));
        }),
      )
      .subscribe();
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

      try {
        this.planEntryCount.set(await this.recipesService.countMealPlanEntries(recipeId));
      } catch {
        this.planEntryCount.set(0);
      }

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

  openShortcut(recipeId: string, recipeTitle: string): void {
    this.shortcuts.openMenu({
      kind: 'recipe',
      recipeId,
      recipeTitle,
    });
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

  openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  async confirmDelete(): Promise<void> {
    if (!this.recipeId || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.actionError.set(null);

    try {
      await this.recipesService.deleteRecipe(this.recipeId);
      this.showDeleteConfirm.set(false);
      await this.router.navigate(['/recipes']);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      this.deleting.set(false);
    }
  }

  togglePhotoMenu(): void {
    this.showPhotoMenu.update((value) => !value);
  }

  closePhotoMenu(): void {
    this.showPhotoMenu.set(false);
  }

  openPhotoPicker(input: HTMLInputElement): void {
    this.closePhotoMenu();
    input.click();
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || !this.recipeId) {
      return;
    }

    this.photoBusy.set(true);
    this.actionError.set(null);

    try {
      await this.recipePhoto.attachPhoto(this.recipeId, file);
      await this.loadDetail(this.recipeId);
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : RECIPE_PHOTO_REPLACE_ERROR,
      );
    } finally {
      this.photoBusy.set(false);
    }
  }

  async removePhoto(): Promise<void> {
    if (!this.recipeId || this.photoBusy()) {
      return;
    }

    this.closePhotoMenu();
    this.photoBusy.set(true);
    this.actionError.set(null);

    try {
      await this.recipePhoto.removePhoto(this.recipeId);
      await this.loadDetail(this.recipeId);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Impossible de retirer la photo.');
    } finally {
      this.photoBusy.set(false);
    }
  }
}
