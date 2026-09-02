import { inject, Injectable } from '@angular/core';

import { shouldShowBackupReminder } from '../../core/backup/backup-reminder';
import { DatabaseService } from '../../core/database/database.service';
import { MEAL_PLAN_SLOT_LABELS } from '../../core/models/meal-plan-entry';
import { toLocalIsoDate } from '../meal-plan/utils/week-dates';
import { isExpiryAlert } from '../pantry/pantry-expiry.util';
import type { HomeDashboardSnapshot, HomeMealSlot } from './home-dashboard.types';

@Injectable({ providedIn: 'root' })
export class HomeDashboardService {
  private readonly database = inject(DatabaseService);

  async loadDashboard(now = new Date()): Promise<HomeDashboardSnapshot> {
    const today = toLocalIsoDate(now);
    const [entries, shoppingItems, pantryItems, settings] = await Promise.all([
      this.database.listMealPlanEntriesByDate(today),
      this.database.listShoppingListItemsWithProducts(),
      this.database.listPantryItemsWithProducts(),
      this.database.getAppSettings(),
    ]);

    const meals: HomeMealSlot[] = [];
    for (const entry of entries) {
      const detail = await this.database.getRecipeDetail(entry.recipeId);
      meals.push({
        slot: entry.slot,
        slotLabel: MEAL_PLAN_SLOT_LABELS[entry.slot],
        recipeTitle: detail?.recipe.title ?? 'Recette introuvable',
      });
    }

    return {
      meals,
      remainingShoppingCount: shoppingItems.filter((item) => !item.checked).length,
      expiringItems: pantryItems
        .filter((item) => isExpiryAlert(item.expiryDate, now))
        .map((item) => ({ id: item.id, name: item.productName })),
      showExportReminder: shouldShowBackupReminder(settings, now),
    };
  }
}
