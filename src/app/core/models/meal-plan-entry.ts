export type MealPlanSlot = 'breakfast' | 'lunch' | 'dinner';

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

export function createMealPlanEntry(input: CreateMealPlanEntryInput): MealPlanEntry {
  return {
    id: crypto.randomUUID(),
    date: input.date,
    slot: input.slot,
    recipeId: input.recipeId,
    recipeVariantId: input.recipeVariantId,
  };
}
