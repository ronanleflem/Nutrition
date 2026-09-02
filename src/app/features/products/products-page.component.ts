import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DatabaseService } from '../../core/database/database.service';
import { FoodSearchCascadeResultsComponent } from '../../core/food-library/components/food-search-cascade-results/food-search-cascade-results.component';
import { FoodLibraryImportService } from '../../core/food-library/food-library-import.service';
import {
  isLibrarySearchHit,
  isOnlineSearchHit,
  isUsdaSearchHit,
} from '../../core/food-library/food-library-search.types';
import { isCatalogSearchHit } from '../../core/food-library/ingredient-picker-search';
import {
  buildFoodRepoCascadeMessage,
  buildOffCascadeMessage,
  buildUsdaCascadeMessage,
} from '../../core/food-library/food-search-cascade-messages';
import { runFoodSearchCascade } from '../../core/food-library/food-search-cascade-runner';
import type { FoodSearchCascadeSection } from '../../core/food-library/food-search-cascade.types';
import {
  FOOD_SEARCH_ONLINE_DEBOUNCE_MS,
  FOOD_SEARCH_ONLINE_MIN_QUERY_LENGTH,
  FoodSearchService,
} from '../../core/food-library/food-search.service';
import type { IngredientSearchHit } from '../../core/food-library/ingredient-picker-search.types';
import { NetworkStatusService } from '../../core/network/network-status.service';
import { UsdaFoodCacheService } from '../../core/usda-fdc/usda-food-cache.service';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductsService } from './services/products.service';
import { ScanService } from './services/scan.service';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, ProductCardComponent, EmptyStateComponent, FoodSearchCascadeResultsComponent],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly foodSearch = inject(FoodSearchService);
  private readonly database = inject(DatabaseService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly importService = inject(FoodLibraryImportService);
  private readonly scanService = inject(ScanService);
  private readonly usdaFoodCache = inject(UsdaFoodCacheService);
  private readonly router = inject(Router);

  private searchSequence = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastQuery = '';

  readonly catalog = this.productsService.catalog;
  readonly loading = this.productsService.loading;
  readonly searchQuery = signal('');
  readonly sections = signal<FoodSearchCascadeSection[]>([]);
  readonly searching = signal(false);
  readonly searchingOnline = signal(false);
  readonly onlinePending = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly importingId = signal<string | null>(null);
  readonly offSearchMessage = signal<string | null>(null);
  readonly foodRepoSearchMessage = signal<string | null>(null);
  readonly foodRepoStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);
  readonly usdaSearchMessage = signal<string | null>(null);
  readonly usdaStatus = signal<'ok' | 'skipped' | 'no_api_key' | 'unauthorized' | 'network_error' | undefined>(undefined);

  readonly isOnline = this.networkStatus.isOnline;
  readonly hasCatalog = computed(() => this.catalog().length > 0);
  readonly hasSearchQuery = computed(() => this.searchQuery().trim().length > 0);
  readonly showBrowseList = computed(() => !this.hasSearchQuery());

  ngOnInit(): void {
    void this.productsService.loadCatalog();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.scheduleSearch(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.sections.set([]);
    this.searchError.set(null);
    this.onlinePending.set(false);
  }

  searchOnlineManually(): void {
    void this.runSearch(this.lastQuery, true);
  }

  async onCascadeHitSelected(hit: IngredientSearchHit): Promise<void> {
    if (isCatalogSearchHit(hit)) {
      await this.router.navigate(['/products', hit.productId]);
      return;
    }

    if (isOnlineSearchHit(hit)) {
      if (isUsdaSearchHit(hit)) {
        await this.usdaFoodCache.put(hit.cacheEntry);
      }

      await this.scanService.openFromOffSearchPrefill(hit.prefill);
      return;
    }

    if (!isLibrarySearchHit(hit)) {
      return;
    }

    this.importingId.set(hit.id);
    this.searchError.set(null);

    try {
      const result = await this.importService.importFromLibrary(hit);
      if (result.status === 'created') {
        await this.productsService.loadCatalog();
        await this.router.navigate(['/products', result.product.id]);
      }
    } catch {
      this.searchError.set('Import impossible. Réessayez.');
    } finally {
      this.importingId.set(null);
    }
  }

  private scheduleSearch(query: string): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query.trim()) {
      this.sections.set([]);
      return;
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = null;
      void this.runSearch(query);
    }, FOOD_SEARCH_ONLINE_DEBOUNCE_MS);
  }

  private async runSearch(query: string, forceOnline = false): Promise<void> {
    const sequence = ++this.searchSequence;
    const trimmed = query.trim();
    this.lastQuery = trimmed;

    if (!trimmed) {
      this.sections.set([]);
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
        { query: trimmed, catalog: this.catalog(), forceOnline },
      );
      if (sequence !== this.searchSequence) {
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
      if (sequence !== this.searchSequence) {
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
