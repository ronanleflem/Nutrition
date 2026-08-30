import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly online = signal(this.readOnlineStatus());

  readonly isOnline = this.online.asReadonly();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const onOnline = () => this.online.set(true);
    const onOffline = () => this.online.set(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  }

  private readOnlineStatus(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
