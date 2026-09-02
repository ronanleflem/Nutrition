import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { APP_SETTINGS_SINGLETON_ID } from '../../core/models/app-settings';
import { ShoppingListService } from '../shopping-list/services/shopping-list.service';
import { toLocalIsoDate } from '../meal-plan/utils/week-dates';
import { HomeDashboardService } from './home-dashboard.service';

describe('HomeDashboardService', () => {
  let database: DatabaseService;
  let service: HomeDashboardService;
  const now = new Date(2026, 8, 2, 12, 0, 0);

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    database = TestBed.inject(DatabaseService);
    service = TestBed.inject(HomeDashboardService);
    await database.initialize();
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function createProductWithPreferredReference(name: string): Promise<string> {
    const product = await database.createProduct({ name });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'carrefour',
      label: `${name} ref`,
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 12,
    });
    await database.setPreferredReference(product.id, reference.id);
    return product.id;
  }

  async function createSampleRecipe(title: string): Promise<string> {
    const productId = await createProductWithPreferredReference(`${title} ingrédient`);
    const result = await database.createRecipeWithFirstVariant({
      recipe: {
        title,
        steps: ['Préparer'],
        defaultPortions: 1,
      },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 100 }],
    });
    return result.recipe.id;
  }

  function localDateOffset(days: number): string {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return toLocalIsoDate(date);
  }

  it('lists today’s planned meals with slot labels and recipe titles', async () => {
    const lunchId = await createSampleRecipe('Salade quinoa');
    const dinnerId = await createSampleRecipe('Soupe lentilles');
    await database.createMealPlanEntry({
      date: toLocalIsoDate(now),
      slot: 'lunch',
      recipeId: lunchId,
    });
    await database.createMealPlanEntry({
      date: toLocalIsoDate(now),
      slot: 'dinner',
      recipeId: dinnerId,
    });
    await database.createMealPlanEntry({
      date: localDateOffset(1),
      slot: 'breakfast',
      recipeId: lunchId,
    });

    const snapshot = await service.loadDashboard(now);

    expect(snapshot.meals.map(({ slot, slotLabel, recipeTitle }) => ({
      slot,
      slotLabel,
      recipeTitle,
    }))).toEqual([
      { slot: 'lunch', slotLabel: 'Déjeuner', recipeTitle: 'Salade quinoa' },
      { slot: 'dinner', slotLabel: 'Dîner', recipeTitle: 'Soupe lentilles' },
    ]);
    expect(snapshot.meals.every((meal) => meal.entryId.length > 0)).toBe(true);
  });

  it('uses « Recette introuvable » when the planned recipe is missing', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.mealPlanEntries.put({
      id: 'orphan-entry',
      date: toLocalIsoDate(now),
      slot: 'breakfast',
      recipeId: 'missing-recipe',
    });
    await db.close();

    const snapshot = await service.loadDashboard(now);

    expect(snapshot.meals).toEqual([
      {
        entryId: 'orphan-entry',
        slot: 'breakfast',
        slotLabel: 'Petit-déjeuner',
        recipeTitle: 'Recette introuvable',
      },
    ]);
  });

  it('returns no meals when the plan has no entries today', async () => {
    const snapshot = await service.loadDashboard(now);
    expect(snapshot.meals).toEqual([]);
  });

  it('counts only unchecked shopping items', async () => {
    const oats = await database.createProduct({ name: 'Flocons' });
    const milk = await database.createProduct({ name: 'Lait' });
    const oatsItem = await database.createManualShoppingListItem(oats.id, 200);
    await database.createManualShoppingListItem(milk.id, 1000);
    await database.updateShoppingListItem(oatsItem.id, { checked: true });

    const snapshot = await service.loadDashboard(now);

    expect(snapshot.remainingShoppingCount).toBe(1);
  });

  it('returns a zero shopping count when every item is checked or the list is empty', async () => {
    expect((await service.loadDashboard(now)).remainingShoppingCount).toBe(0);

    const product = await database.createProduct({ name: 'Sel' });
    const item = await database.createManualShoppingListItem(product.id, 50);
    await database.updateShoppingListItem(item.id, { checked: true });

    expect((await service.loadDashboard(now)).remainingShoppingCount).toBe(0);
  });

  it('lists pantry items with DLC ≤ 3 days including expired', async () => {
    const yogurt = await database.createProduct({ name: 'Yaourt' });
    const rice = await database.createProduct({ name: 'Riz' });
    const milk = await database.createProduct({ name: 'Lait' });
    await database.addPantryItem({
      productId: yogurt.id,
      quantityG: 200,
      expiryDate: localDateOffset(2),
    });
    await database.addPantryItem({
      productId: rice.id,
      quantityG: 500,
      expiryDate: localDateOffset(10),
    });
    await database.addPantryItem({
      productId: milk.id,
      quantityG: 1000,
      expiryDate: localDateOffset(-1),
    });

    const snapshot = await service.loadDashboard(now);
    const names = snapshot.expiringItems.map((item) => item.name).sort();

    expect(names).toEqual(['Lait', 'Yaourt']);
  });

  it('returns no DLC alerts when nothing expires within 3 days', async () => {
    const product = await database.createProduct({ name: 'Pâtes' });
    await database.addPantryItem({
      productId: product.id,
      quantityG: 300,
      expiryDate: localDateOffset(10),
    });

    const snapshot = await service.loadDashboard(now);
    expect(snapshot.expiringItems).toEqual([]);
  });

  it('shows the export reminder when the backup is stale', async () => {
    const snapshot = await service.loadDashboard(now);
    expect(snapshot.showExportReminder).toBe(true);
  });

  it('hides the export reminder when backup is recent', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
      lastExportAt: now.toISOString(),
    });
    await db.close();

    expect((await service.loadDashboard(now)).showExportReminder).toBe(false);
  });

  it('hides the export reminder when backup is stale but snoozed', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
      lastExportAt: '2026-01-01T00:00:00.000Z',
      backupReminderDismissedAt: now.toISOString(),
    });
    await db.close();

    expect((await service.loadDashboard(now)).showExportReminder).toBe(false);
  });

  it('keeps other meals when one recipe lookup fails', async () => {
    const lunchId = await createSampleRecipe('Salade quinoa');
    await database.createMealPlanEntry({
      date: toLocalIsoDate(now),
      slot: 'lunch',
      recipeId: lunchId,
    });
    vi.spyOn(database, 'getRecipeDetail').mockRejectedValueOnce(new Error('fail'));

    const snapshot = await service.loadDashboard(now);

    expect(snapshot.meals).toEqual([
      expect.objectContaining({
        slot: 'lunch',
        recipeTitle: 'Recette introuvable',
      }),
    ]);
  });

  it('reads shopping items without calling ShoppingListService.refresh()', async () => {
    const refresh = vi.spyOn(ShoppingListService.prototype, 'refresh');
    await service.loadDashboard(now);
    expect(refresh).not.toHaveBeenCalled();
    refresh.mockRestore();
  });
});
