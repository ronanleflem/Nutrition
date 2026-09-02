import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { OPENNUTRITION_INLINE_CREDIT } from '../../../../core/food-library/food-library-attribution';
import {
  isOnlineSearchHit,
  type FoodLibraryPageSearchResult,
  type FoodLibrarySearchHit,
  type FoodLibrarySearchSection,
} from '../../../../core/food-library/food-library-search.types';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import type { StarterPackImportSummary } from '../../../../core/food-library/food-library-import.service';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { FOOD_LIBRARY_STARTER_PACK_LABEL } from '../../../../core/food-library/food-library-starter-pack';
import { FoodSearchService } from '../../../../core/food-library/food-search.service';
import type { FoodSearchHit } from '../../../../core/food-library/food-search.types';
import { NetworkStatusService } from '../../../../core/network/network-status.service';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { ProductsService } from '../../services/products.service';
import { ScanService } from '../../services/scan.service';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_OFFLINE_QUERY_LENGTH = 1;

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
  private readonly scanService = inject(ScanService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly router = inject(Router);

  private searchSequence = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isOnlineSearchHit = isOnlineSearchHit;
  readonly isOnline = this.networkStatus.isOnline;

  readonly starterPackLabel = FOOD_LIBRARY_STARTER_PACK_LABEL;
  readonly openNutritionCredit = OPENNUTRITION_INLINE_CREDIT;
  readonly searchQuery = signal('');
  readonly sections = signal<FoodLibrarySearchSection[]>([]);
  readonly searching = signal(false);
  readonly searchingOff = signal(false);
  readonly importingId = signal<string | null>(null);
  readonly importingStarterPack = signal(false);
  readonly starterPackSummary = signal<StarterPackImportSummary | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly offSearchMessage = signal<string | null>(null);
  readonly foodRepoSearchMessage = signal<string | null>(null);
  readonly foodRepoStatus = signal<FoodLibraryPageSearchResult['foodRepoStatus']>(undefined);
  readonly importError = signal<string | null>(null);
  readonly pendingDuplicate = signal<{
    hit: FoodSearchHit;
    match: FoodLibraryImportDuplicate['match'];
  } | null>(null);

  readonly loadError = this.foodSearch.loadError;

  formatMacros(hit: FoodLibrarySearchHit): string {
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

  async selectHit(hit: FoodLibrarySearchHit): Promise<void> {
    if (isOnlineSearchHit(hit)) {
      await this.scanService.openFromOffSearchPrefill(hit.prefill);
      return;
    }

    await this.importHit(hit);
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

    if (!trimmed || trimmed.length < MIN_OFFLINE_QUERY_LENGTH) {
      this.sections.set([]);
      this.searchError.set(null);
      this.offSearchMessage.set(null);
      this.foodRepoSearchMessage.set(null);
      this.foodRepoStatus.set(undefined);
      return;
    }

    this.searching.set(true);
    this.searchError.set(null);
    this.offSearchMessage.set(null);
    this.foodRepoSearchMessage.set(null);
    this.foodRepoStatus.set(undefined);

    if (this.networkStatus.isOnline() && trimmed.length >= 3) {
      this.searchingOff.set(true);
    }

    try {
      const result = await this.foodSearch.searchLibraryPage(trimmed);
      if (sequence !== this.searchSequence) {
        return;
      }

      this.sections.set(result.sections);
      this.offSearchMessage.set(this.buildOffSearchMessage(result.offStatus, result.offMsUntilRetry));
      this.foodRepoStatus.set(result.foodRepoStatus);
      this.foodRepoSearchMessage.set(this.buildFoodRepoSearchMessage(result.foodRepoStatus));
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
        this.searchingOff.set(false);
      }
    }
  }

  private buildOffSearchMessage(
    status: FoodLibraryPageSearchResult['offStatus'],
    msUntilRetry?: number,
  ): string | null {
    if (status === 'rate_limited' && msUntilRetry != null) {
      const seconds = Math.ceil(msUntilRetry / 1000);
      return `Trop de recherches Open Food Facts — réessayez dans ${seconds} s.`;
    }

    if (status === 'network_error') {
      return 'Recherche Open Food Facts indisponible pour le moment.';
    }

    return null;
  }

  private buildFoodRepoSearchMessage(
    status: FoodLibraryPageSearchResult['foodRepoStatus'],
  ): string | null {
    if (status === 'no_api_key') {
      return null;
    }

    if (status === 'unauthorized') {
      return 'Clé FoodRepo invalide — vérifiez vos paramètres.';
    }

    if (status === 'network_error') {
      return 'Recherche FoodRepo indisponible pour le moment.';
    }

    return null;
  }
}
