import { inject, Injectable, signal } from '@angular/core';

import { DatabaseService } from '../../../core/database/database.service';
import type { RecipeDetail } from '../../../core/models/recipe-detail';
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
  recipeId?: string;
  recipeTitle?: string;
  photoBlobId?: string;
  resolvedVariantId?: string;
  variantLabel?: string;
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
  private recipeDetailsById = new Map<string, RecipeDetail>();

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

      const recipeIds = [...new Set(entries.map((entry) => entry.recipeId))];
      const details = await Promise.all(recipeIds.map((recipeId) => this.database.getRecipeDetail(recipeId)));

      this.entries.set(entries);
      this.recipes.set(recipes);
      this.recipeTitleById = new Map(recipes.map((item) => [item.recipe.id, item.recipe.title]));
      this.recipeDetailsById = new Map(
        details
          .filter((detail): detail is RecipeDetail => detail != null)
          .map((detail) => [detail.recipe.id, detail]),
      );
    } finally {
      this.loading.set(false);
    }
  }

  getSlotsForDate(date: string): MealPlanSlotView[] {
    const entriesForDate = this.entries().filter((entry) => entry.date === date);

    return (['breakfast', 'lunch', 'dinner'] as const).map((slot) => {
      const entry = entriesForDate.find((candidate) => candidate.slot === slot);
      if (!entry) {
        return { slot };
      }

      const detail = this.recipeDetailsById.get(entry.recipeId);
      const resolvedVariantId = entry.recipeVariantId ?? detail?.recipe.defaultVariantId;
      const variant = detail?.variants.find((item) => item.id === resolvedVariantId);
      const variantLabel = entry.recipeVariantId == null ? 'Par défaut' : (variant?.name ?? 'Variante');

      return {
        slot,
        entry,
        recipeId: entry.recipeId,
        recipeTitle: this.recipeTitleById.get(entry.recipeId) ?? 'Recette supprimée',
        photoBlobId: detail?.recipe.photoBlobId,
        resolvedVariantId,
        variantLabel,
      };
    });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  async goToPreviousWeek(): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), -7));
    this.selectedDate.set(toLocalIsoDate(addDays(parseLocalIsoDate(this.selectedDate()), -7)));
    await this.loadWeek();
  }

  async goToNextWeek(): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), 7));
    this.selectedDate.set(toLocalIsoDate(addDays(parseLocalIsoDate(this.selectedDate()), 7)));
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

  async updateVariant(entryId: string, recipeVariantId: string | null): Promise<void> {
    await this.database.updateMealPlanEntryVariant(entryId, recipeVariantId);
    await this.loadWeek();
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.database.deleteMealPlanEntry(entryId);
    await this.loadWeek();
  }

  getRecipeDetail(recipeId: string): RecipeDetail | undefined {
    return this.recipeDetailsById.get(recipeId);
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
