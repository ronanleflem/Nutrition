import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private readonly errorMessage = signal<string | null>(null);

  readonly bootstrapError = this.errorMessage.asReadonly();

  setBootstrapError(message: string): void {
    this.errorMessage.set(message);
  }
}
