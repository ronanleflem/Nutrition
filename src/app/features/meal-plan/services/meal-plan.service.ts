import { inject, Injectable, signal } from '@angular/core';

import {
  DatabaseService,
} from '../../../core/database/database.service';
import type { MealPlanEntry, MealPlanSlot } from '../../../core/models/meal-plan-entry';
import type { RecipeListItem } from '../../../core/models/recipe-list-item';
import {
  addDays,
  getMondayOfWeek,
  getWeekDays,
  parseLocalIsoDate,
  toLocalIsoDate,
  type WeekDay,
} from '../utils/week-dates';

export interface MealPlanSlotView {
  slot: MealPlanSlot;
  entry?: MealPlanEntry;
  recipeTitle?: string;
}

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly database = inject(DatabaseService);

  readonly weekStart = signal(getMondayOfWeek(new Date()));
  readonly selectedDate = signal(toLocalIsoDate(new Date()));
  readonly weekDays = signal<WeekDay[]>(getWeekDays(getMondayOfWeek(new Date())));
  readonly entries = signal<MealPlanEntry[]>([]);
  readonly recipes = signal<RecipeListItem[]>([]);
  readonly loading = signal(false);

  private recipeTitleById = new Map<string, string>();

  async loadWeek(): Promise<void> {
    this.loading.set(true);

    try {
      const weekStart = this.weekStart();
      const weekDays = getWeekDays(weekStart);
      this.weekDays.set(weekDays);

      const startDate = weekDays[0].date;
      const endDate = weekDays[6].date;
      const [entries, recipes] = await Promise.all([
        this.database.listMealPlanEntriesBetweenDates(startDate, endDate),
        this.database.listRecipes(),
      ]);

      this.entries.set(entries);
      this.recipes.set(recipes);
      this.recipeTitleById = new Map(recipes.map((item) => [item.recipe.id, item.recipe.title]));
    } finally {
      this.loading.set(false);
    }
  }

  getSlotsForDate(date: string): MealPlanSlotView[] {
    const entriesForDate = this.entries().filter((entry) => entry.date === date);

    return (['breakfast', 'lunch', 'dinner'] as const).map((slot) => {
      const entry = entriesForDate.find((candidate) => candidate.slot === slot);

      return {
        slot,
        entry,
        recipeTitle: entry ? this.recipeTitleById.get(entry.recipeId) : undefined,
      };
    });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  async goToPreviousWeek(): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), -7));
    await this.loadWeek();
  }

  async goToNextWeek(): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), 7));
    await this.loadWeek();
  }

  async goToCurrentWeek(): Promise<void> {
    const today = new Date();
    this.weekStart.set(getMondayOfWeek(today));
    this.selectedDate.set(toLocalIsoDate(today));
    await this.loadWeek();
  }

  async assignRecipe(date: string, slot: MealPlanSlot, recipeId: string): Promise<void> {
    await this.database.createMealPlanEntry({ date, slot, recipeId });
    await this.loadWeek();
  }

  async changeRecipe(entryId: string, recipeId: string): Promise<void> {
    await this.database.updateMealPlanEntry(entryId, {
      recipeId,
      recipeVariantId: null,
    });
    await this.loadWeek();
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.database.deleteMealPlanEntry(entryId);
    await this.loadWeek();
  }

  getSelectedDayLabel(): string {
    const date = parseLocalIsoDate(this.selectedDate());
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
