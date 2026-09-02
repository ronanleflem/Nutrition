import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DatabaseService } from '../../core/database/database.service';
import { SearchCacheService } from '../../core/food-library/search-cache.service';
import { OnboardingService } from '../onboarding/onboarding.service';

@Component({
  selector: 'app-settings-page',
  imports: [RouterLink],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit {
  private readonly searchCache = inject(SearchCacheService);
  private readonly database = inject(DatabaseService);
  private readonly onboarding = inject(OnboardingService);

  readonly hideHomeOnStartup = signal(false);
  readonly homePreferenceReady = signal(false);
  readonly savingHomePreference = signal(false);
  readonly homePreferenceMessage = signal<string | null>(null);
  readonly homePreferenceError = signal<string | null>(null);
  readonly clearingSearchHistory = signal(false);
  readonly searchHistoryMessage = signal<string | null>(null);
  readonly searchHistoryError = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadHomePreference();
  }

  async onHideHomeChange(event: Event): Promise<void> {
    if (!this.homePreferenceReady()) {
      (event.target as HTMLInputElement).checked = this.hideHomeOnStartup();
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    this.hideHomeOnStartup.set(checked);
    this.savingHomePreference.set(true);
    this.homePreferenceMessage.set(null);
    this.homePreferenceError.set(null);

    try {
      await this.database.updateHideHomeOnStartup(checked);
      this.homePreferenceMessage.set('Préférence enregistrée.');
    } catch {
      this.hideHomeOnStartup.set(!checked);
      this.homePreferenceError.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.savingHomePreference.set(false);
    }
  }

  onRelaunchOnboarding(): void {
    this.onboarding.resetForRelaunch();
  }

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

  private async loadHomePreference(): Promise<void> {
    try {
      const settings = await this.database.getAppSettings();
      this.hideHomeOnStartup.set(settings.hideHomeOnStartup === true);
    } catch {
      this.homePreferenceError.set('Chargement impossible. Réessayez.');
    } finally {
      this.homePreferenceReady.set(true);
    }
  }
}
