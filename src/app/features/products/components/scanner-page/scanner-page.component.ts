import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { isIosDevice } from '../../../../core/platform/is-ios';
import { ScanService } from '../../services/scan.service';

@Component({
  selector: 'app-scanner-page',
  imports: [FormsModule, RouterLink, ZXingScannerModule],
  templateUrl: './scanner-page.component.html',
  styleUrl: './scanner-page.component.scss',
})
export class ScannerPageComponent implements OnInit, OnDestroy {
  private readonly scanService = inject(ScanService);

  readonly isIos = signal(false);
  readonly cameraEnabled = signal(true);
  readonly cameraDenied = signal(false);
  readonly manualBarcode = signal('');
  readonly resolving = this.scanService.resolving;
  readonly errorMessage = this.scanService.lastError;
  readonly pendingRestore = this.scanService.pendingRestore;

  private scanLocked = false;

  ngOnInit(): void {
    const ios = isIosDevice();
    this.isIos.set(ios);
    if (ios) {
      this.cameraEnabled.set(false);
    }
  }

  ngOnDestroy(): void {
    this.scanLocked = false;
  }

  onPermissionResponse(granted: boolean): void {
    if (!granted) {
      this.cameraDenied.set(true);
      this.cameraEnabled.set(false);
    }
  }

  onCamerasNotFound(): void {
    this.cameraDenied.set(true);
    this.cameraEnabled.set(false);
  }

  onScanError(): void {
    this.cameraDenied.set(true);
    this.cameraEnabled.set(false);
  }

  async onScanSuccess(barcode: string): Promise<void> {
    if (this.scanLocked || this.resolving()) {
      return;
    }

    this.scanLocked = true;

    try {
      await this.scanService.resolveBarcode(barcode);
    } finally {
      this.scanLocked = false;
    }
  }

  async submitManualBarcode(): Promise<void> {
    await this.scanService.resolveBarcode(this.manualBarcode());
  }

  openManualEntry(): void {
    this.scanService.openManualEntry(this.manualBarcode());
  }

  async restoreArchivedProduct(): Promise<void> {
    await this.scanService.restorePendingProduct();
  }

  dismissRestorePrompt(): void {
    this.scanService.clearPendingRestore();
  }
}
