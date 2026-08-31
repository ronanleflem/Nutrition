export const MACRO_GOALS_SINGLETON_ID = 'singleton' as const;

export interface MacroGoals {
  id: typeof MACRO_GOALS_SINGLETON_ID;
  kcal?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
  fiberG?: number;
}

export function createDefaultMacroGoals(): MacroGoals {
  return {
    id: MACRO_GOALS_SINGLETON_ID,
  };
}

export type UpdateMacroGoalsInput = {
  kcal?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbsG?: number | null;
  fiberG?: number | null;
};
