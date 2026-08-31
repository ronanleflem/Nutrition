export type MacroBarState = 'under' | 'met' | 'over' | 'neutral';

export type MacroNutrientKey = 'kcal' | 'proteinG' | 'fatG' | 'carbsG' | 'fiberG';

export const MACRO_GOAL_TOLERANCE = 0.05;

export function compareMacroToGoal(actual: number, goal?: number): MacroBarState {
  if (goal == null || goal <= 0) {
    return 'neutral';
  }

  const lower = goal * (1 - MACRO_GOAL_TOLERANCE);
  const upper = goal * (1 + MACRO_GOAL_TOLERANCE);

  if (actual < lower) {
    return 'under';
  }

  if (actual > upper) {
    return 'over';
  }

  return 'met';
}

export function macroBarFillPercent(actual: number, goal?: number): number {
  if (goal == null || goal <= 0) {
    return 0;
  }

  return Math.min(100, (actual / goal) * 100);
}
