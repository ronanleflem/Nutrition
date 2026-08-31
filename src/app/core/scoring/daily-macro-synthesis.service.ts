import { Injectable, inject } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import {
  buildMacroBars,
  type DailyMacroSynthesis,
  type DailyMealMacroRow,
  MEAL_PLAN_SLOT_LABELS,
} from '../models/daily-macro-synthesis';
import type { MealPlanEntry } from '../models/meal-plan-entry';
import {
  addRecipeMacros,
  EMPTY_RECIPE_MACROS,
  type RecipeMacros,
} from '../models/recipe-macros';
import { RecipeMacroService } from './recipe-macro.service';

@Injectable({ providedIn: 'root' })
export class DailyMacroSynthesisService {
  private readonly databaseService = inject(DatabaseService);
  private readonly recipeMacroService = inject(RecipeMacroService);

  async getDailySynthesis(date: string): Promise<DailyMacroSynthesis> {
    const [entries, goals] = await Promise.all([
      this.databaseService.listMealPlanEntriesByDate(date),
      this.databaseService.getMacroGoals(),
    ]);

    const meals: DailyMealMacroRow[] = [];
    let totals: RecipeMacros = { ...EMPTY_RECIPE_MACROS };
    let incomplete = false;

    for (const entry of entries) {
      const meal = await this.buildMealRow(entry);
      if (!meal) {
        continue;
      }

      meals.push(meal);
      totals = addRecipeMacros(totals, meal.macros);
      incomplete = incomplete || meal.incomplete;
    }

    return {
      date,
      totals,
      incomplete,
      hasMeals: meals.length > 0,
      meals,
      bars: buildMacroBars(totals, goals),
    };
  }

  private async buildMealRow(entry: MealPlanEntry): Promise<DailyMealMacroRow | null> {
    const detail = await this.databaseService.getRecipeDetail(entry.recipeId);
    if (!detail) {
      return null;
    }

    const resolvedVariantId = entry.recipeVariantId ?? detail.recipe.defaultVariantId;
    const variant = detail.variants.find((item) => item.id === resolvedVariantId);
    if (!variant) {
      return null;
    }

    const breakdown = this.recipeMacroService.calculateForVariant(variant, detail.recipe.defaultPortions);

    return {
      entryId: entry.id,
      slot: entry.slot,
      slotLabel: MEAL_PLAN_SLOT_LABELS[entry.slot],
      recipeTitle: detail.recipe.title,
      variantName: variant.name,
      macros: breakdown.perPortion,
      incomplete: breakdown.incomplete,
    };
  }
}
