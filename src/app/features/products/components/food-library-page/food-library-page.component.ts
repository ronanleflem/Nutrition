import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { OPENNUTRITION_INLINE_CREDIT } from '../../../../core/food-library/food-library-attribution';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import type { StarterPackImportSummary } from '../../../../core/food-library/food-library-import.service';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { FOOD_LIBRARY_STARTER_PACK_LABEL } from '../../../../core/food-library/food-library-starter-pack';
import { FoodSearchService } from '../../../../core/food-library/food-search.service';
import type { FoodSearchHit, FoodSearchSection } from '../../../../core/food-library/food-search.types';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { ProductsService } from '../../services/products.service';

const SEARCH_DEBOUNCE_MS = 200;

@Component({
  selector: 'app-food-library-page',
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './food-library-page.component.html',
  styleUrl: './food-library-page.component.scss',
})
export class FoodLibraryPageComponent {
  private readonly foodSearch = inject(FoodSearchService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  private searchSequence = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly starterPackLabel = FOOD_LIBRARY_STARTER_PACK_LABEL;
  readonly openNutritionCredit = OPENNUTRITION_INLINE_CREDIT;
  readonly searchQuery = signal('');
  readonly sections = signal<FoodSearchSection[]>([]);
  readonly searching = signal(false);
  readonly importingId = signal<string | null>(null);
  readonly importingStarterPack = signal(false);
  readonly starterPackSummary = signal<StarterPackImportSummary | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly importError = signal<string | null>(null);
  readonly pendingDuplicate = signal<{
    hit: FoodSearchHit;
    match: FoodLibraryImportDuplicate['match'];
  } | null>(null);

  readonly loadError = this.foodSearch.loadError;

  formatMacros(hit: FoodSearchHit): string {
    return formatMacrosSummary({
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    });
  }

  hasOpenNutritionResults(): boolean {
    return this.sections().some((section) => section.source === 'opennutrition');
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.scheduleSearch(query);
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

  async importStarterPack(): Promise<void> {
    this.importingStarterPack.set(true);
    this.importError.set(null);
    this.starterPackSummary.set(null);

    try {
      const summary = await this.importService.importStarterPack();
      this.starterPackSummary.set(summary);
      await this.productsService.loadCatalog();
    } catch {
      this.importError.set('Import du pack démarrage impossible. Réessayez.');
    } finally {
      this.importingStarterPack.set(false);
    }
  }

  formatStarterPackSummary(summary: StarterPackImportSummary): string {
    const parts = [`${summary.added} ajouté${summary.added > 1 ? 's' : ''}`];
    if (summary.alreadyPresent > 0) {
      parts.push(`${summary.alreadyPresent} déjà présent${summary.alreadyPresent > 1 ? 's' : ''}`);
    }
    if (summary.missing > 0) {
      parts.push(`${summary.missing} introuvable${summary.missing > 1 ? 's' : ''}`);
    }
    return parts.join(', ');
  }

  private scheduleSearch(query: string): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = null;
      void this.runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  }

  private async runSearch(query: string): Promise<void> {
    const sequence = ++this.searchSequence;
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
      if (sequence !== this.searchSequence) {
        return;
      }

      this.sections.set(result.sections);
    } catch {
      if (sequence !== this.searchSequence) {
        return;
      }

      this.searchError.set(
        this.foodSearch.loadError() ?? 'Bibliothèque offline indisponible.',
      );
      this.sections.set([]);
    } finally {
      if (sequence === this.searchSequence) {
        this.searching.set(false);
      }
    }
  }
}
