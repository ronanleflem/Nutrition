import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseService } from '../../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../../core/database/nutrition-database.testing';
import { FoodLibraryPageComponent } from './food-library-page.component';

describe('FoodLibraryPageComponent onboarding back link', () => {
  let fixture: ComponentFixture<FoodLibraryPageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);
  });

  afterEach(async () => {
    fixture?.destroy();
    await database?.closeForTests();
    await deleteNutritionDatabase();
    TestBed.resetTestingModule();
  });

  async function mount(fromOnboarding: boolean): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [FoodLibraryPageComponent],
      providers: [
        provideRouter([
          { path: 'onboarding', component: FoodLibraryPageComponent },
          { path: 'products', component: FoodLibraryPageComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(fromOnboarding ? { from: 'onboarding' } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
    fixture = TestBed.createComponent(FoodLibraryPageComponent);
    fixture.detectChanges();
  }

  it('links back to the wizard when opened from onboarding', async () => {
    await mount(true);

    const back = fixture.nativeElement.querySelector(
      '[data-action="back-to-onboarding"]',
    ) as HTMLAnchorElement;
    expect(back).toBeTruthy();
    expect(back.getAttribute('href')).toBe('/onboarding');
    expect(back.textContent).toContain('Retour au guidage');
  });

  it('links back to the catalog without the onboarding query', async () => {
    await mount(false);

    const back = fixture.nativeElement.querySelector(
      '.food-library-page__back',
    ) as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/products');
    expect(fixture.nativeElement.querySelector('[data-action="back-to-onboarding"]')).toBeNull();
  });
});
