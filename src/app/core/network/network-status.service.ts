import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly online = signal(this.readOnlineStatus());

  readonly isOnline = this.online.asReadonly();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }

  private readOnlineStatus(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
