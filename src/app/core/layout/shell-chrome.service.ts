import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShellChromeService {
  readonly hidden = signal(false);

  setHidden(hidden: boolean): void {
    this.hidden.set(hidden);
  }
}
