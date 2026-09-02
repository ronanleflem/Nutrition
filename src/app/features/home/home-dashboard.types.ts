import type { MealPlanSlot } from '../../core/models/meal-plan-entry';

export interface HomeMealSlot {
  entryId: string;
  slot: MealPlanSlot;
  slotLabel: string;
  recipeTitle: string;
}

export interface HomeExpiringItem {
  id: string;
  name: string;
}

export interface HomeDashboardSnapshot {
  meals: HomeMealSlot[];
  remainingShoppingCount: number;
  expiringItems: HomeExpiringItem[];
  showExportReminder: boolean;
}
