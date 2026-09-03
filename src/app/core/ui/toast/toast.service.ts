import { Injectable, signal } from '@angular/core';

const DEFAULT_TOAST_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(text: string, durationMs = DEFAULT_TOAST_DURATION_MS): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.message.set(text);

    this.hideTimer = setTimeout(() => {
      this.dismiss();
    }, durationMs);
  }

  dismiss(): void {
    this.message.set(null);

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
