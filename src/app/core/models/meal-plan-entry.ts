export type MealPlanSlot = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_PLAN_SLOTS: MealPlanSlot[] = ['breakfast', 'lunch', 'dinner'];

export const MEAL_PLAN_SLOT_LABELS: Record<MealPlanSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

export interface MealPlanEntry {
  id: string;
  date: string;
  slot: MealPlanSlot;
  recipeId: string;
  recipeVariantId?: string;
}

export interface CreateMealPlanEntryInput {
  date: string;
  slot: MealPlanSlot;
  recipeId: string;
  recipeVariantId?: string;
}

export interface UpdateMealPlanEntryInput {
  recipeId: string;
  recipeVariantId?: string | null;
}

export function createMealPlanEntry(input: CreateMealPlanEntryInput): MealPlanEntry {
  return {
    id: crypto.randomUUID(),
    date: input.date,
    slot: input.slot,
    recipeId: input.recipeId,
    recipeVariantId: input.recipeVariantId,
  };
}
