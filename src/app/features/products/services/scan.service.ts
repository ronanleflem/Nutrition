import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { isActiveProduct } from '../../../core/models/product';
import { isValidEan, normalizeBarcodeInput } from '../../../core/barcode/ean';
import { DatabaseService } from '../../../core/database/database.service';
import { FoodSearchService } from '../../../core/food-library/food-search.service';
import { foodSearchHitToPrefill } from '../../../core/food-library/food-search-hit-prefill';
import { NetworkStatusService } from '../../../core/network/network-status.service';
import { OffApiService } from '../../../core/off-api/off-api.service';
import type { OffProductPrefill } from '../../../core/off-api/off-product-prefill';
import type { PendingRestoreMatch } from '../models/pending-restore-match';
import type { OnlineSearchPrefillSource, ScanFlowState } from '../models/scan-flow-state';
import { ProductsService } from './products.service';

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly database = inject(DatabaseService);
  private readonly productsService = inject(ProductsService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly offApi = inject(OffApiService);
  private readonly foodSearch = inject(FoodSearchService);
  private readonly router = inject(Router);

  readonly flowState = signal<ScanFlowState | null>(null);
  readonly pendingRestore = signal<PendingRestoreMatch | null>(null);
  readonly resolving = signal(false);
  readonly lastError = signal<string | null>(null);

  async resolveBarcode(rawBarcode: string): Promise<void> {
    const barcode = normalizeBarcodeInput(rawBarcode);
    this.lastError.set(null);
    this.pendingRestore.set(null);

    if (!isValidEan(barcode)) {
      this.lastError.set('Code-barres invalide. Saisissez un EAN-8 ou EAN-13 valide.');
      return;
    }

    this.resolving.set(true);

    try {
      const existing = await this.database.findReferenceByBarcode(barcode);
      if (existing) {
        if (isActiveProduct(existing.product)) {
          await this.router.navigate(['/products', existing.product.id]);
          return;
        }

        this.pendingRestore.set(existing);
        return;
      }

      if (!this.networkStatus.isOnline()) {
        const libraryHit = await this.lookupOfflineLibraryBarcode(barcode);
        if (libraryHit) {
          this.openReferenceForm({
            barcode,
            status: 'offline-library-found',
            prefill: foodSearchHitToPrefill(libraryHit, barcode),
          });
          return;
        }

        this.openReferenceForm({
          barcode,
          status: 'offline',
        });
        return;
      }

      const lookup = await this.offApi.lookupProduct(barcode);
      if (lookup.status === 'found') {
        this.openReferenceForm({
          barcode,
          status: 'off-found',
          prefill: lookup.prefill,
        });
        return;
      }

      if (lookup.status === 'network_error') {
        const libraryHit = await this.lookupOfflineLibraryBarcode(barcode);
        if (libraryHit) {
          this.openReferenceForm({
            barcode,
            status: 'offline-library-found',
            prefill: foodSearchHitToPrefill(libraryHit, barcode),
          });
          return;
        }

        this.openReferenceForm({
          barcode,
          status: 'network-error',
        });
        return;
      }

      const libraryHit = await this.lookupOfflineLibraryBarcode(barcode);
      if (libraryHit) {
        this.openReferenceForm({
          barcode,
          status: 'offline-library-found',
          prefill: foodSearchHitToPrefill(libraryHit, barcode),
        });
        return;
      }

      this.openReferenceForm({
        barcode,
        status: 'off-unknown',
      });
    } finally {
      this.resolving.set(false);
    }
  }

  async restorePendingProduct(): Promise<void> {
    const match = this.pendingRestore();
    if (!match) {
      return;
    }

    await this.productsService.restoreProduct(match.product.id);
    this.pendingRestore.set(null);
    await this.router.navigate(['/products', match.product.id]);
  }

  clearPendingRestore(): void {
    this.pendingRestore.set(null);
  }

  async openFromOnlineSearchPrefill(
    prefill: OffProductPrefill,
    source: OnlineSearchPrefillSource = 'off',
  ): Promise<void> {
    const statusBySource: Record<OnlineSearchPrefillSource, ScanFlowState['status']> = {
      off: 'off-found',
      foodrepo: 'foodrepo-found',
      usda: 'usda-found',
    };

    await this.openReferenceForm({
      barcode: prefill.barcode,
      status: statusBySource[source],
      prefill,
    });
  }

  /** @deprecated Use openFromOnlineSearchPrefill */
  async openFromOffSearchPrefill(prefill: OffProductPrefill): Promise<void> {
    await this.openFromOnlineSearchPrefill(prefill, 'off');
  }

  openManualEntry(barcode = ''): void {
    const normalized = barcode ? normalizeBarcodeInput(barcode) : '';
    this.openReferenceForm({
      barcode: normalized,
      status: 'manual',
    });
  }

  clearFlowState(): void {
    this.flowState.set(null);
  }

  private async lookupOfflineLibraryBarcode(barcode: string) {
    try {
      return await this.foodSearch.searchByBarcode(barcode);
    } catch {
      return null;
    }
  }

  private async openReferenceForm(state: ScanFlowState): Promise<void> {
    this.flowState.set(state);
    await this.router.navigate(['/products', 'scan', 'reference']);
  }
}
