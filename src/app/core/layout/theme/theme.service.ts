import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from '../../database/database.service';
import type { AppTheme } from '../../models/app-settings';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly database = inject(DatabaseService);

  readonly currentTheme = signal<AppTheme>('dark');

  applyTheme(theme: AppTheme): AppTheme {
    document.documentElement.dataset['theme'] = theme;
    this.currentTheme.set(theme);
    return theme;
  }

  async applyFromSettings(): Promise<AppTheme> {
    const settings = await this.database.getAppSettings();
    return this.applyTheme(settings.theme);
  }
}
