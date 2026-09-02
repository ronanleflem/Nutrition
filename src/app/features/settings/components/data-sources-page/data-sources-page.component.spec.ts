import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../../core/database/nutrition-database.testing';
import { FOOD_LIBRARY_ATTRIBUTIONS } from '../../../../core/food-library/food-library-attribution';
import { DataSourcesPageComponent } from './data-sources-page.component';

describe('DataSourcesPageComponent', () => {
  let fixture: ComponentFixture<DataSourcesPageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [DataSourcesPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function waitForSettingsLoad(expected?: {
    foodRepoApiKey?: string;
    usdaApiKey?: string;
    preferManualOnlineSearch?: boolean;
  }): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const value = fixture.componentInstance.form.getRawValue();

      if (expected) {
        if (
          value.foodRepoApiKey === (expected.foodRepoApiKey ?? '') &&
          value.usdaApiKey === (expected.usdaApiKey ?? '') &&
          value.preferManualOnlineSearch === (expected.preferManualOnlineSearch ?? false)
        ) {
          return;
        }
      } else if (attempt >= 4) {
        return;
      }
    }

    if (expected) {
      throw new Error('Data sources settings load timed out');
    }
  }

  async function mountComponent(expected?: {
    foodRepoApiKey?: string;
    usdaApiKey?: string;
    preferManualOnlineSearch?: boolean;
  }): Promise<void> {
    fixture = TestBed.createComponent(DataSourcesPageComponent);
    fixture.detectChanges();
    await waitForSettingsLoad(expected);
  }

  it('loads API keys from appSettings into the form', async () => {
    await database.updateFoodRepoApiKey('foodrepo-secret');
    await database.updateUsdaApiKey('usda-secret');
    await database.updatePreferManualOnlineSearch(true);

    await mountComponent({
      foodRepoApiKey: 'foodrepo-secret',
      usdaApiKey: 'usda-secret',
      preferManualOnlineSearch: true,
    });

    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      foodRepoApiKey: 'foodrepo-secret',
      usdaApiKey: 'usda-secret',
      preferManualOnlineSearch: true,
    });
    expect(fixture.componentInstance.missingUsdaKey()).toBe(false);
  });

  it('persists API keys locally on save', async () => {
    await mountComponent();

    fixture.componentInstance.form.patchValue({
      foodRepoApiKey: ' new-foodrepo ',
      usdaApiKey: ' new-usda ',
      preferManualOnlineSearch: true,
    });

    await fixture.componentInstance.save();
    fixture.detectChanges();

    const settings = await database.getAppSettings();
    expect(settings.foodRepoApiKey).toBe('new-foodrepo');
    expect(settings.usdaApiKey).toBe('new-usda');
    expect(settings.preferManualOnlineSearch).toBe(true);
    expect(fixture.componentInstance.saveMessage()).toBe('Clés enregistrées localement.');
  });

  it('renders attribution licences for all data sources (FR-38)', async () => {
    await mountComponent();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Attributions');
    expect(text).toContain(FOOD_LIBRARY_ATTRIBUTIONS.ciqual.license);
    expect(text).toContain(FOOD_LIBRARY_ATTRIBUTIONS.opennutrition.license);
    expect(text).toContain(FOOD_LIBRARY_ATTRIBUTIONS.openFoodFacts.license);
    expect(text).toContain(FOOD_LIBRARY_ATTRIBUTIONS.foodRepo.license);
    expect(text).toContain(FOOD_LIBRARY_ATTRIBUTIONS.usda.license);
  });
});
