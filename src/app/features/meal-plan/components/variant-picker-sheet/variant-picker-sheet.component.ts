import { Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { DatabaseService } from '../../../../core/database/database.service';
import type { RecipeDetail } from '../../../../core/models/recipe-detail';
import type { RecipeMacroBreakdown } from '../../../../core/models/recipe-macros';
import { RecipeMacroService } from '../../../../core/scoring/recipe-macro.service';
import { RecipeMacrosPanelComponent } from '../../../recipes/components/recipe-macros-panel/recipe-macros-panel.component';
import { VariantChipRowComponent } from '../../../recipes/components/variant-chip-row/variant-chip-row.component';

@Component({
  selector: 'app-variant-picker-sheet',
  imports: [VariantChipRowComponent, RecipeMacrosPanelComponent],
  templateUrl: './variant-picker-sheet.component.html',
  styleUrl: './variant-picker-sheet.component.scss',
})
export class VariantPickerSheetComponent {
  private readonly database = inject(DatabaseService);
  private readonly recipeMacroService = inject(RecipeMacroService);

  readonly recipeId = input.required<string>();
  readonly selectedVariantId = input.required<string>();
  readonly closed = output<void>();
  readonly selected = output<string>();

  readonly detail = signal<RecipeDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly activeVariantId = signal('');

  readonly activeVariantMacros = computed<RecipeMacroBreakdown | null>(() => {
    const current = this.detail();
    const variantId = this.activeVariantId();
    if (!current || !variantId) {
      return null;
    }

    const variant = current.variants.find((item) => item.id === variantId);
    if (!variant) {
      return null;
    }

    return this.recipeMacroService.calculateForVariant(variant, current.recipe.defaultPortions);
  });

  constructor() {
    effect(() => {
      const recipeId = this.recipeId();
      void this.loadDetail(recipeId);
    });

    effect(() => {
      this.activeVariantId.set(this.selectedVariantId());
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  onVariantSelected(variantId: string): void {
    this.activeVariantId.set(variantId);
    this.selected.emit(variantId);
  }

  private async loadDetail(recipeId: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const detail = await this.database.getRecipeDetail(recipeId);
      if (!detail) {
        this.loadError.set('Recette introuvable.');
        this.detail.set(null);
        return;
      }

      this.detail.set(detail);
      this.activeVariantId.set(this.selectedVariantId() || detail.recipe.defaultVariantId);
    } catch {
      this.loadError.set('Impossible de charger les variantes.');
      this.detail.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
