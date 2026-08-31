import type { MealPlanEntry } from '../models/meal-plan-entry';

const SLOT_ORDER: Record<MealPlanEntry['slot'], number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
};

export function computeMealPlanFingerprint(entries: MealPlanEntry[]): string {
  return [...entries]
    .sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return SLOT_ORDER[left.slot] - SLOT_ORDER[right.slot];
    })
    .map(
      (entry) =>
        `${entry.date}:${entry.slot}:${entry.recipeId}:${entry.recipeVariantId ?? ''}`,
    )
    .join('|');
}
