import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from '../../database/database.service';
import type { AppTheme } from '../../models/app-settings';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly database = inject(DatabaseService);

  readonly currentTheme = signal<AppTheme>('dark');

  applyTheme(_theme?: AppTheme): AppTheme {
    document.documentElement.dataset['theme'] = 'dark';
    this.currentTheme.set('dark');
    return 'dark';
  }

  async applyFromSettings(): Promise<AppTheme> {
    await this.database.getAppSettings();
    return this.applyTheme('dark');
  }
}
