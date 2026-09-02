import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { DatabaseService } from '../../../../core/database/database.service';
import { OPENNUTRITION_INLINE_CREDIT } from '../../../../core/food-library/food-library-attribution';
import {
  isLibrarySearchHit,
  isOnlineSearchHit,
  isUsdaSearchHit,
  type FoodLibrarySearchHit,
  type FoodLibrarySearchSection,
} from '../../../../core/food-library/food-library-search.types';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import type { StarterPackImportSummary } from '../../../../core/food-library/food-library-import.service';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { FOOD_LIBRARY_STARTER_PACK_LABEL } from '../../../../core/food-library/food-library-starter-pack';
import {
  buildFoodRepoCascadeMessage,
  buildOffCascadeMessage,
  buildUsdaCascadeMessage,
} from '../../../../core/food-library/food-search-cascade-messages';
import { runFoodSearchCascade } from '../../../../core/food-library/food-search-cascade-runner';
import {
  buildOfflineSearchBanner,
  hasCachedOnlineSections,
} from '../../../../core/food-library/online-search-provider-utils';
import {
  FOOD_SEARCH_ONLINE_DEBOUNCE_MS,
  FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH,
  FoodSearchService,
} from '../../../../core/food-library/food-search.service';
import type { FoodSearchHit } from '../../../../core/food-library/food-search.types';
import { ONLINE_CASCADE_SOURCES } from '../../../../core/food-library/food-search-cascade.types';
import { NetworkStatusService } from '../../../../core/network/network-status.service';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { ProductsService } from '../../services/products.service';
import { ScanService } from '../../services/scan.service';
import { UsdaFoodCacheService } from '../../../../core/usda-fdc/usda-food-cache.service';

const MIN_OFFLINE_QUERY_LENGTH = 1;

@Component({
  selector: 'app-food-library-page',
  imports: [RouterLink, ConfirmDialogComponent],
  templateUrl: './food-library-page.component.html',
  styleUrl: './food-library-page.component.scss',
})
export class FoodLibraryPageComponent implements OnDestroy {
  private readonly foodSearch = inject(FoodSearchService);
  private readonly database = inject(DatabaseService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly productsService = inject(ProductsService);
  private readonly scanService = inject(ScanService);
  private readonly usdaFoodCache = inject(UsdaFoodCacheService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly router = inject(Router);

  private searchSequence = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private searchAbort: AbortController | null = null;
  private lastQuery = '';

  readonly isOnlineSearchHit = isOnlineSearchHit;
  readonly isOnline = this.networkStatus.isOnline;
  readonly onlineCascadeSources = ONLINE_CASCADE_SOURCES;

  readonly starterPackLabel = FOOD_LIBRARY_STARTER_PACK_LABEL;
  readonly openNutritionCredit = OPENNUTRITION_INLINE_CREDIT;
  readonly searchQuery = signal('');
  readonly sections = signal<FoodLibrarySearchSection[]>([]);
  readonly searching = signal(false);
  readonly searchingOnline = signal(false);
  readonly onlinePending = signal(false);
  readonly importingId = signal<string | null>(null);
  readonly importingStarterPack = signal(false);
  readonly starterPackSummary = signal<StarterPackImportSummary | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly offSearchMessage = signal<string | null>(null);
  readonly foodRepoSearchMessage = signal<string | null>(null);
  readonly foodRepoStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);
  readonly usdaSearchMessage = signal<string | null>(null);
  readonly usdaStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);
  readonly importError = signal<string | null>(null);
  readonly pendingDuplicate = signal<{
    hit: FoodSearchHit;
    match: FoodLibraryImportDuplicate['match'];
  } | null>(null);

  readonly loadError = this.foodSearch.loadError;
  readonly offlineSearchBanner = computed(() =>
    buildOfflineSearchBanner(hasCachedOnlineSections(this.sections())),
  );

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchAbort?.abort();
  }

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

  isOnlineSectionLoading(source: string): boolean {
    return this.searchingOnline() && (ONLINE_CASCADE_SOURCES as readonly string[]).includes(source);
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.scheduleSearch(query);
  }

  searchOnlineManually(): void {
    void this.runSearch(this.lastQuery, true);
  }

  async selectHit(hit: FoodLibrarySearchHit): Promise<void> {
    if (isOnlineSearchHit(hit)) {
      if (isUsdaSearchHit(hit)) {
        await this.usdaFoodCache.put(hit.cacheEntry);
      }

      await this.scanService.openFromOnlineSearchPrefill(hit.prefill, hit.source);
      return;
    }

    if (isLibrarySearchHit(hit)) {
      await this.importHit(hit);
    }
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
    }, FOOD_SEARCH_ONLINE_DEBOUNCE_MS);
  }

  private async runSearch(query: string, forceOnline = false): Promise<void> {
    this.searchAbort?.abort();
    this.searchAbort = new AbortController();
    const abortSignal = this.searchAbort.signal;

    const sequence = ++this.searchSequence;
    const trimmed = query.trim();
    this.lastQuery = trimmed;

    if (!trimmed || trimmed.length < MIN_OFFLINE_QUERY_LENGTH) {
      this.resetSearchState();
      return;
    }

    this.searching.set(true);
    this.searchError.set(null);
    this.offSearchMessage.set(null);
    this.foodRepoSearchMessage.set(null);
    this.foodRepoStatus.set(undefined);
    this.usdaSearchMessage.set(null);
    this.usdaStatus.set(undefined);
    this.onlinePending.set(false);

    const willSearchOnline =
      this.networkStatus.isOnline() && trimmed.length >= FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH;
    this.searchingOnline.set(
      willSearchOnline && (forceOnline || !(await this.database.getAppSettings()).preferManualOnlineSearch),
    );

    try {
      const outcome = await runFoodSearchCascade(
        this.foodSearch,
        this.database,
        this.networkStatus,
        { query: trimmed, forceOnline, abortSignal },
      );
      if (sequence !== this.searchSequence || abortSignal.aborted) {
        return;
      }

      const result = outcome.result;
      this.sections.set(
        result.sections.filter((section) => section.source !== 'catalog') as FoodLibrarySearchSection[],
      );
      this.onlinePending.set(outcome.onlinePending);
      this.offSearchMessage.set(buildOffCascadeMessage(result.offStatus, result.offMsUntilRetry));
      this.foodRepoStatus.set(result.foodRepoStatus);
      this.foodRepoSearchMessage.set(buildFoodRepoCascadeMessage(result.foodRepoStatus));
      this.usdaStatus.set(result.usdaStatus);
      this.usdaSearchMessage.set(buildUsdaCascadeMessage(result.usdaStatus));
    } catch {
      if (sequence !== this.searchSequence || abortSignal.aborted) {
        return;
      }

      this.searchError.set(
        this.foodSearch.loadError() ?? 'Bibliothèque offline indisponible.',
      );
      this.sections.set([]);
    } finally {
      if (sequence === this.searchSequence) {
        this.searching.set(false);
        this.searchingOnline.set(false);
      }
    }
  }

  private resetSearchState(): void {
    this.sections.set([]);
    this.searchError.set(null);
    this.offSearchMessage.set(null);
    this.foodRepoSearchMessage.set(null);
    this.foodRepoStatus.set(undefined);
    this.usdaSearchMessage.set(null);
    this.usdaStatus.set(undefined);
    this.onlinePending.set(false);
    this.searchingOnline.set(false);
  }
}
