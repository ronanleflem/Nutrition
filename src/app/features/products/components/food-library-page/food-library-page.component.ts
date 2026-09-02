import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { FoodSearchService } from '../../../../core/food-library/food-search.service';
import type { FoodSearchHit, FoodSearchSection } from '../../../../core/food-library/food-search.types';
import { formatMacrosSummary } from '../../../../core/models/product-reference';

@Component({
  selector: 'app-food-library-page',
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './food-library-page.component.html',
  styleUrl: './food-library-page.component.scss',
})
export class FoodLibraryPageComponent {
  private readonly foodSearch = inject(FoodSearchService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly router = inject(Router);

  readonly sections = signal<FoodSearchSection[]>([]);
  readonly searching = signal(false);
  readonly importingId = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly importError = signal<string | null>(null);
  readonly pendingDuplicate = signal<{
    hit: FoodSearchHit;
    match: FoodLibraryImportDuplicate['match'];
  } | null>(null);

  formatMacros(hit: FoodSearchHit): string {
    return formatMacrosSummary({
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    });
  }

  async onSearchInput(event: Event): Promise<void> {
    const query = (event.target as HTMLInputElement).value;
    await this.runSearch(query);
  }

  async importHit(hit: FoodSearchHit): Promise<void> {
    this.importingId.set(hit.id);
    this.importError.set(null);

    try {
      const result = await this.importService.importFromLibrary(hit);
      if (result.status === 'duplicate') {
        this.pendingDuplicate.set({ hit, match: result.match });
        return;
      }

      await this.router.navigate(['/products', result.product.id]);
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
    await this.router.navigate(['/products', pending.match.existingProduct.id]);
  }

  async createDespiteDuplicate(): Promise<void> {
    const pending = this.pendingDuplicate();
    if (!pending) {
      return;
    }

    this.importingId.set(pending.hit.id);
    this.importError.set(null);

    try {
      const result = await this.importService.importFromLibrary(pending.hit, { forceCreate: true });
      this.pendingDuplicate.set(null);

      if (result.status === 'created') {
        await this.router.navigate(['/products', result.product.id]);
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
      const result = await this.foodSearch.searchLocal(trimmed);
      this.sections.set(result.sections);
    } catch {
      this.searchError.set('Bibliothèque offline indisponible.');
      this.sections.set([]);
    } finally {
      this.searching.set(false);
    }
  }
}
