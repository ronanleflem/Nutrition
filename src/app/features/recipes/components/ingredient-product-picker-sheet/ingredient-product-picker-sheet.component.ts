import { Component, computed, inject, input, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { foodCategoryLabelFromHit } from '../../../../core/food-category/food-category-from-hit';
import { FoodCategoryLabelComponent } from '../../../../core/ui/food-category-label/food-category-label.component';
import { DatabaseService } from '../../../../core/database/database.service';
import type { FoodLibraryImportDuplicate } from '../../../../core/food-library/food-library-import';
import { OPENNUTRITION_INLINE_CREDIT } from '../../../../core/food-library/food-library-attribution';
import { FoodLibraryImportService } from '../../../../core/food-library/food-library-import.service';
import {
  isLibrarySearchHit,
  isOnlineSearchHit,
  isUsdaSearchHit,
} from '../../../../core/food-library/food-library-search.types';
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
import { ONLINE_CASCADE_SOURCES } from '../../../../core/food-library/food-search-cascade.types';
import {
  FOOD_SEARCH_ONLINE_DEBOUNCE_MS,
  FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH,
  FoodSearchService,
} from '../../../../core/food-library/food-search.service';
import { isCatalogSearchHit } from '../../../../core/food-library/ingredient-picker-search';
import type { IngredientSearchHit, IngredientSearchSection } from '../../../../core/food-library/ingredient-picker-search.types';
import { NetworkStatusService } from '../../../../core/network/network-status.service';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import type { ProductCatalogItem } from '../../../../core/models/product-catalog';
import { UsdaFoodCacheService } from '../../../../core/usda-fdc/usda-food-cache.service';
import { ProductsService } from '../../../products/services/products.service';
import { ScanService } from '../../../products/services/scan.service';

@Component({
  selector: 'app-ingredient-product-picker-sheet',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, FoodCategoryLabelComponent],
  templateUrl: './ingredient-product-picker-sheet.component.html',
  styleUrl: './ingredient-product-picker-sheet.component.scss',
})
export class IngredientProductPickerSheetComponent implements OnDestroy {
  private readonly foodSearch = inject(FoodSearchService);
  private readonly database = inject(DatabaseService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly productsService = inject(ProductsService);
  private readonly scanService = inject(ScanService);
  private readonly usdaFoodCache = inject(UsdaFoodCacheService);
  private readonly networkStatus = inject(NetworkStatusService);

  private searchSequence = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private searchAbort: AbortController | null = null;
  private lastQuery = '';

  readonly isCatalogSearchHit = isCatalogSearchHit;
  readonly isOnlineSearchHit = isOnlineSearchHit;
  readonly isOnline = this.networkStatus.isOnline;

  readonly catalog = input.required<ProductCatalogItem[]>();
  readonly selected = output<string>();
  readonly closed = output<void>();

  readonly openNutritionCredit = OPENNUTRITION_INLINE_CREDIT;
  readonly categoryLabelFromHit = foodCategoryLabelFromHit;
  readonly searchQuery = signal('');
  readonly sections = signal<IngredientSearchSection[]>([]);
  readonly searching = signal(false);
  readonly searchingOnline = signal(false);
  readonly onlinePending = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly importError = signal<string | null>(null);
  readonly importingId = signal<string | null>(null);
  readonly offSearchMessage = signal<string | null>(null);
  readonly foodRepoSearchMessage = signal<string | null>(null);
  readonly foodRepoStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);
  readonly usdaSearchMessage = signal<string | null>(null);
  readonly usdaStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);
  readonly pendingDuplicate = signal<{
    hit: IngredientSearchHit;
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

  formatMacros(hit: IngredientSearchHit): string {
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

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.scheduleSearch(value);
  }

  searchOnlineManually(): void {
    void this.runSearch(this.lastQuery, true);
  }

  async selectHit(hit: IngredientSearchHit): Promise<void> {
    if (isCatalogSearchHit(hit)) {
      this.selected.emit(hit.productId);
      return;
    }

    if (isOnlineSearchHit(hit)) {
      if (isUsdaSearchHit(hit)) {
        await this.usdaFoodCache.put(hit.cacheEntry);
      }

      this.closed.emit();
      await this.scanService.openFromOnlineSearchPrefill(hit.prefill, hit.source);
      return;
    }

    if (!isLibrarySearchHit(hit)) {
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
    if (!pending || isCatalogSearchHit(pending.hit) || isOnlineSearchHit(pending.hit)) {
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

    if (!trimmed) {
      this.sections.set([]);
      this.searchError.set(null);
      this.onlinePending.set(false);
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
        { query: trimmed, catalog: this.catalog(), forceOnline, abortSignal },
      );
      if (sequence !== this.searchSequence || abortSignal.aborted) {
        return;
      }

      const result = outcome.result;
      this.sections.set(result.sections);
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

      this.searchError.set(this.foodSearch.loadError() ?? 'Recherche indisponible.');
      this.sections.set([]);
    } finally {
      if (sequence === this.searchSequence) {
        this.searching.set(false);
        this.searchingOnline.set(false);
      }
    }
  }
}
