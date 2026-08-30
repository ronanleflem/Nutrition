import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { isValidEan, normalizeBarcodeInput } from '../../../core/barcode/ean';
import { DatabaseService } from '../../../core/database/database.service';
import { NetworkStatusService } from '../../../core/network/network-status.service';
import { OffApiService } from '../../../core/off-api/off-api.service';
import type { ScanFlowState } from '../models/scan-flow-state';

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly database = inject(DatabaseService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly offApi = inject(OffApiService);
  private readonly router = inject(Router);

  readonly flowState = signal<ScanFlowState | null>(null);
  readonly resolving = signal(false);
  readonly lastError = signal<string | null>(null);

  async resolveBarcode(rawBarcode: string): Promise<void> {
    const barcode = normalizeBarcodeInput(rawBarcode);
    this.lastError.set(null);

    if (!isValidEan(barcode)) {
      this.lastError.set('Code-barres invalide. Saisissez un EAN-8 ou EAN-13 valide.');
      return;
    }

    this.resolving.set(true);

    try {
      const existing = await this.database.getActiveReferenceByBarcode(barcode);
      if (existing) {
        await this.router.navigate(['/products', existing.productId]);
        return;
      }

      if (!this.networkStatus.isOnline()) {
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
        this.openReferenceForm({
          barcode,
          status: 'offline',
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

  private async openReferenceForm(state: ScanFlowState): Promise<void> {
    this.flowState.set(state);
    await this.router.navigate(['/products', 'scan', 'reference']);
  }
}
