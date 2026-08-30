import { Injectable, inject } from '@angular/core';

import { DatabaseService } from '../../database/database.service';
import type { AppTheme } from '../../models/app-settings';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly database = inject(DatabaseService);

  async applyFromSettings(): Promise<AppTheme> {
    const settings = await this.database.getAppSettings();
    document.documentElement.dataset['theme'] = settings.theme;
    return settings.theme;
  }
}
