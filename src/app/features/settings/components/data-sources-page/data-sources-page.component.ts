import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DatabaseService } from '../../../../core/database/database.service';
import { FOOD_LIBRARY_ATTRIBUTIONS } from '../../../../core/food-library/food-library-attribution';
import { clearAllOnlineSearchSessionCaches } from '../../../../core/food-library/online-search-provider-utils';
import { FoodRepoSearchProvider } from '../../../../core/foodrepo-api/foodrepo-search.provider';
import { OffSearchProvider } from '../../../../core/off-api/off-search.provider';
import { UsdaFdcSearchProvider } from '../../../../core/usda-fdc/usda-search.provider';

@Component({
  selector: 'app-data-sources-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './data-sources-page.component.html',
  styleUrl: './data-sources-page.component.scss',
})
export class DataSourcesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly database = inject(DatabaseService);
  private readonly offSearch = inject(OffSearchProvider);
  private readonly foodRepoSearch = inject(FoodRepoSearchProvider);
  private readonly usdaSearch = inject(UsdaFdcSearchProvider);

  readonly sources = FOOD_LIBRARY_ATTRIBUTIONS;
  readonly saving = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly missingUsdaKey = signal(false);

  readonly form = this.fb.nonNullable.group({
    foodRepoApiKey: [''],
    usdaApiKey: [''],
    preferManualOnlineSearch: [false],
  });

  ngOnInit(): void {
    void this.loadSettings();
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.saveMessage.set(null);
    this.saveError.set(null);

    try {
      const foodRepoValue = this.form.controls.foodRepoApiKey.value.trim();
      const usdaValue = this.form.controls.usdaApiKey.value.trim();
      const preferManual = this.form.controls.preferManualOnlineSearch.value;
      await this.database.updateFoodRepoApiKey(foodRepoValue || undefined);
      await this.database.updateUsdaApiKey(usdaValue || undefined);
      await this.database.updatePreferManualOnlineSearch(preferManual);
      clearAllOnlineSearchSessionCaches(this.offSearch, this.foodRepoSearch, this.usdaSearch);
      this.missingUsdaKey.set(!usdaValue);
      this.saveMessage.set('Clés enregistrées localement.');
    } catch {
      this.saveError.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.database.getAppSettings();
    this.form.patchValue({
      foodRepoApiKey: settings.foodRepoApiKey ?? '',
      usdaApiKey: settings.usdaApiKey ?? '',
      preferManualOnlineSearch: settings.preferManualOnlineSearch === true,
    });
    this.missingUsdaKey.set(!settings.usdaApiKey?.trim());
  }
}
