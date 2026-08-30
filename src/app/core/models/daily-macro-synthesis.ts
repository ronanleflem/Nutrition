import type { MacroBarState, MacroNutrientKey } from './macro-bar-state';
import type { MealPlanSlot } from './meal-plan-entry';
import type { MacroGoals } from './macro-goals';
import type { RecipeMacros } from './recipe-macros';
import { compareMacroToGoal, macroBarFillPercent } from './macro-bar-state';

export interface MacroBarViewModel {
  key: MacroNutrientKey;
  label: string;
  unit: 'kcal' | 'g';
  current: number;
  goal?: number;
  state: MacroBarState;
  fillPercent: number;
  valueLabel: string;
  ariaLabel: string;
}

export interface DailyMealMacroRow {
  entryId: string;
  slot: MealPlanSlot;
  slotLabel: string;
  recipeTitle: string;
  variantName: string;
  macros: RecipeMacros;
  incomplete: boolean;
}

export interface DailyMacroSynthesis {
  date: string;
  totals: RecipeMacros;
  incomplete: boolean;
  hasMeals: boolean;
  meals: DailyMealMacroRow[];
  bars: MacroBarViewModel[];
}

const BAR_DEFINITIONS: Array<{ key: MacroNutrientKey; label: string; unit: 'kcal' | 'g' }> = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protéines', unit: 'g' },
  { key: 'fatG', label: 'Lipides', unit: 'g' },
  { key: 'carbsG', label: 'Glucides', unit: 'g' },
  { key: 'fiberG', label: 'Fibres', unit: 'g' },
];

export function buildMacroBars(totals: RecipeMacros, goals: MacroGoals): MacroBarViewModel[] {
  return BAR_DEFINITIONS.map((definition) => {
    const current = totals[definition.key];
    const goal = goals[definition.key];
    const state = compareMacroToGoal(current, goal);
    const fillPercent = macroBarFillPercent(current, goal);

    return {
      key: definition.key,
      label: definition.label,
      unit: definition.unit,
      current,
      goal,
      state,
      fillPercent,
      valueLabel: formatMacroValueLabel(current, goal, definition.unit),
      ariaLabel: formatMacroAriaLabel(definition.label, current, goal, definition.unit),
    };
  });
}

function formatMacroValueLabel(current: number, goal: number | undefined, unit: 'kcal' | 'g'): string {
  const formattedCurrent = formatMacroNumber(current);

  if (goal == null) {
    return unit === 'kcal' ? `${formattedCurrent} kcal` : `${formattedCurrent} g`;
  }

  const formattedGoal = formatMacroNumber(goal);
  return unit === 'kcal'
    ? `${formattedCurrent} / ${formattedGoal} kcal`
    : `${formattedCurrent} / ${formattedGoal} g`;
}

function formatMacroAriaLabel(
  label: string,
  current: number,
  goal: number | undefined,
  unit: 'kcal' | 'g',
): string {
  const unitLabel = unit === 'kcal' ? 'kilocalories' : 'grammes';

  if (goal == null) {
    return `${label} : ${formatMacroNumber(current)} ${unitLabel}`;
  }

  return `${label} : ${formatMacroNumber(current)} ${unitLabel} sur ${formatMacroNumber(goal)}`;
}

function formatMacroNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);
}

export const MEAL_PLAN_SLOT_LABELS: Record<MealPlanSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

export function formatIsoDateLabel(date: string): string {
  const parsed = parseIsoDate(date);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parsed);
}

export function todayIsoDate(): string {
  return formatIsoDate(new Date());
}

export function shiftIsoDate(date: string, days: number): string {
  const parsed = parseIsoDate(date);
  parsed.setDate(parsed.getDate() + days);
  return formatIsoDate(parsed);
}

function parseIsoDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
