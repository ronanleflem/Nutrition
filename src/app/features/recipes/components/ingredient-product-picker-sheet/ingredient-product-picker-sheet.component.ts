import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import { FoodSearchService } from '../../../../core/food-library/food-search.service';
import {
  isCatalogSearchHit,
} from '../../../../core/food-library/ingredient-picker-search';
import type { IngredientSearchHit, IngredientSearchSection } from '../../../../core/food-library/ingredient-picker-search.types';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import type { ProductCatalogItem } from '../../../../core/models/product-catalog';
import { ProductsService } from '../../../products/services/products.service';

@Component({
  selector: 'app-ingredient-product-picker-sheet',
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './ingredient-product-picker-sheet.component.html',
  styleUrl: './ingredient-product-picker-sheet.component.scss',
})
export class IngredientProductPickerSheetComponent {
  private readonly foodSearch = inject(FoodSearchService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly productsService = inject(ProductsService);

  readonly isCatalogSearchHit = isCatalogSearchHit;

  readonly catalog = input.required<ProductCatalogItem[]>();
  readonly selected = output<string>();
  readonly closed = output<void>();

  readonly searchQuery = signal('');
  readonly sections = signal<IngredientSearchSection[]>([]);
  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly importError = signal<string | null>(null);
  readonly importingId = signal<string | null>(null);
  readonly pendingDuplicate = signal<{
    hit: IngredientSearchHit;
    match: FoodLibraryImportDuplicate['match'];
  } | null>(null);

  formatMacros(hit: IngredientSearchHit): string {
    return formatMacrosSummary({
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    void this.runSearch(value);
  }

  async selectHit(hit: IngredientSearchHit): Promise<void> {
    if (isCatalogSearchHit(hit)) {
      this.selected.emit(hit.productId);
      return;
    }

    this.importingId.set(hit.id);
    this.importError.set(null);

    try {
      const result = await this.importService.importFromLibrary(hit);
      if (result.status === 'duplicate') {
        this.pendingDuplicate.set({ hit, match: result.match });
        return;
      }

      await this.productsService.loadCatalog();
      this.selected.emit(result.product.id);
    } catch {
      this.importError.set('Import impossible. Réessayez.');
    } finally {
      this.importingId.set(null);
    }
  }

  async useExistingProduct(): Promise<void> {
    const pending = this.pendingDuplicate();
    if (!pending) {
      return;
    }

    this.pendingDuplicate.set(null);
    this.selected.emit(pending.match.existingProduct.id);
  }

  async createDespiteDuplicate(): Promise<void> {
    const pending = this.pendingDuplicate();
    if (!pending || isCatalogSearchHit(pending.hit)) {
      return;
    }

    this.importingId.set(pending.hit.id);
    this.importError.set(null);

    try {
      const result = await this.importService.importFromLibrary(pending.hit, { forceCreate: true });
      this.pendingDuplicate.set(null);

      if (result.status === 'created') {
        await this.productsService.loadCatalog();
        this.selected.emit(result.product.id);
      }
    } catch {
      this.importError.set('Import impossible. Réessayez.');
    } finally {
      this.importingId.set(null);
    }
  }

  cancelDuplicateDialog(): void {
    this.pendingDuplicate.set(null);
  }

  private async runSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      this.sections.set([]);
      this.searchError.set(null);
      return;
    }

    this.searching.set(true);
    this.searchError.set(null);

    try {
      const result = await this.foodSearch.searchForIngredientPicker(this.catalog(), trimmed);
      this.sections.set(result.sections);
    } catch {
      this.searchError.set('Recherche indisponible.');
      this.sections.set([]);
    } finally {
      this.searching.set(false);
    }
  }
}
