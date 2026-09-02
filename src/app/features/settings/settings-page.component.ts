import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SearchCacheService } from '../../core/food-library/search-cache.service';

@Component({
  selector: 'app-settings-page',
  imports: [RouterLink],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  private readonly searchCache = inject(SearchCacheService);

  readonly clearingSearchHistory = signal(false);
  readonly searchHistoryMessage = signal<string | null>(null);
  readonly searchHistoryError = signal<string | null>(null);

  async clearSearchHistory(): Promise<void> {
    this.clearingSearchHistory.set(true);
    this.searchHistoryMessage.set(null);
    this.searchHistoryError.set(null);

    try {
      await this.searchCache.clearHistory();
      this.searchHistoryMessage.set('Historique de recherche effacé.');
    } catch {
      this.searchHistoryError.set('Effacement impossible. Réessayez.');
    } finally {
      this.clearingSearchHistory.set(false);
    }
  }
}
