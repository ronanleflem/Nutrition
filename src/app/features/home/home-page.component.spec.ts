import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { APP_SETTINGS_SINGLETON_ID } from '../../core/models/app-settings';
import { toLocalIsoDate } from '../meal-plan/utils/week-dates';
import { ShoppingListService } from '../shopping-list/services/shopping-list.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function mount(): Promise<void> {
    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    for (let attempt = 0; attempt < 50; attempt++) {
      await fixture.whenStable();
      fixture.detectChanges();
      if (!fixture.componentInstance.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error('Home dashboard load timed out');
  }

  function card(name: string): HTMLAnchorElement {
    return fixture.nativeElement.querySelector(`[data-card="${name}"]`) as HTMLAnchorElement;
  }

  it('renders empty cards with CTAs and shows the export reminder by default', async () => {
    await mount();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Repas du jour');
    expect(text).toContain("Aucun repas prévu aujourd'hui.");
    expect(text).toContain('Ouvrir le plan');
    expect(text).toContain('Aucun article restant.');
    expect(text).toContain('Ouvrir les courses');
    expect(text).toContain('Aucune alerte DLC proche.');
    expect(text).toContain('Voir le garde-manger');
    expect(text).toContain('Sauvegarde');
    expect(text).toContain('Exporter');

    expect(card('meals').getAttribute('href')).toBe('/plan');
    expect(card('shopping').getAttribute('href')).toBe('/shopping');
    expect(card('dlc').getAttribute('href')).toBe('/pantry?filter=expiring');
    expect(card('export').getAttribute('href')).toBe('/settings/export');
  });

  it('shows today’s meals, remaining shopping count, and DLC names', async () => {
    const product = await database.createProduct({ name: 'Poulet' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'carrefour',
      label: 'Poulet ref',
      kcalPer100g: 110,
      proteinPer100g: 22,
      fatPer100g: 3,
      carbsPer100g: 0,
    });
    await database.setPreferredReference(product.id, reference.id);
    const recipe = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Bowl poulet', steps: ['Cuire'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: product.id, quantityG: 150 }],
    });
    await database.createMealPlanEntry({
      date: toLocalIsoDate(new Date()),
      slot: 'lunch',
      recipeId: recipe.recipe.id,
    });

    const oats = await database.createProduct({ name: 'Flocons' });
    await database.createManualShoppingListItem(oats.id, 400);

    const yogurt = await database.createProduct({ name: 'Yaourt' });
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    await database.addPantryItem({
      productId: yogurt.id,
      quantityG: 200,
      expiryDate: toLocalIsoDate(soon),
    });

    await mount();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Déjeuner');
    expect(text).toContain('Bowl poulet');
    expect(text).toContain('1 article restant');
    expect(text).toContain('Yaourt');
    expect(card('meals').getAttribute('href')).toBe('/plan');
    expect(card('shopping').getAttribute('href')).toBe('/shopping');
    expect(card('dlc').getAttribute('href')).toBe('/pantry?filter=expiring');
  });

  it('omits the export card when the backup reminder is hidden', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
      lastExportAt: new Date().toISOString(),
    });
    await db.close();

    await mount();

    expect(card('export')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Sauvegarde');
  });

  it('does not call ShoppingListService.refresh()', async () => {
    const refresh = vi.spyOn(ShoppingListService.prototype, 'refresh');
    await mount();
    expect(refresh).not.toHaveBeenCalled();
    refresh.mockRestore();
  });
});
