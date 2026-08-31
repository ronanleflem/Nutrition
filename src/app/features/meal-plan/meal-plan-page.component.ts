import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MealPlanSlot } from '../../core/models/meal-plan-entry';
import { MealSlotSheetComponent } from './components/meal-slot-sheet/meal-slot-sheet.component';
import { RecipePickerSheetComponent } from './components/recipe-picker-sheet/recipe-picker-sheet.component';
import { WeekGridComponent } from './components/week-grid/week-grid.component';
import { MealPlanService } from './services/meal-plan.service';
import { getIsoWeekLabel } from './utils/week-dates';

type SheetMode = 'picker' | 'slot-detail' | null;

interface ActiveSlot {
  date: string;
  slot: MealPlanSlot;
  entryId?: string;
  recipeTitle?: string;
}

@Component({
  selector: 'app-meal-plan-page',
  imports: [RouterLink, WeekGridComponent, RecipePickerSheetComponent, MealSlotSheetComponent],
  templateUrl: './meal-plan-page.component.html',
  styleUrl: './meal-plan-page.component.scss',
})
export class MealPlanPageComponent implements OnInit {
  protected readonly mealPlan = inject(MealPlanService);

  readonly sheetMode = signal<SheetMode>(null);
  readonly activeSlot = signal<ActiveSlot | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly weekLabel = computed(() => getIsoWeekLabel(this.mealPlan.weekStart()));
  readonly selectedSlots = computed(() => this.mealPlan.getSlotsForDate(this.mealPlan.selectedDate()));

  ngOnInit(): void {
    void this.mealPlan.loadWeek();
  }

  onDaySelected(date: string): void {
    this.mealPlan.selectDate(date);
  }

  onSlotSelected(selection: { date: string; slot: MealPlanSlot; entryId?: string }): void {
    this.errorMessage.set(null);

    if (selection.entryId) {
      const slotView = this.mealPlan
        .getSlotsForDate(selection.date)
        .find((slot) => slot.slot === selection.slot);

      this.activeSlot.set({
        date: selection.date,
        slot: selection.slot,
        entryId: selection.entryId,
        recipeTitle: slotView?.recipeTitle ?? 'Recette supprimée',
      });
      this.sheetMode.set('slot-detail');
      return;
    }

    this.activeSlot.set(selection);
    this.sheetMode.set('picker');
  }

  closeSheet(): void {
    this.sheetMode.set(null);
    this.activeSlot.set(null);
  }

  async onRecipeSelected(recipeId: string): Promise<void> {
    const slot = this.activeSlot();
    if (!slot) {
      return;
    }

    this.errorMessage.set(null);

    try {
      if (slot.entryId) {
        await this.mealPlan.changeRecipe(slot.entryId, recipeId);
      } else {
        await this.mealPlan.assignRecipe(slot.date, slot.slot, recipeId);
      }

      this.closeSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de planifier ce repas.';
      this.errorMessage.set(message);
    }
  }

  openRecipePickerFromSlotDetail(): void {
    const slot = this.activeSlot();
    if (!slot) {
      return;
    }

    this.sheetMode.set('picker');
  }

  async onSlotDeleted(): Promise<void> {
    const slot = this.activeSlot();
    if (!slot?.entryId) {
      return;
    }

    this.errorMessage.set(null);

    try {
      await this.mealPlan.deleteEntry(slot.entryId);
      this.closeSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer.';
      this.errorMessage.set(message);
    }
  }

  async goToPreviousWeek(): Promise<void> {
    await this.mealPlan.goToPreviousWeek();
  }

  async goToNextWeek(): Promise<void> {
    await this.mealPlan.goToNextWeek();
  }

  async goToCurrentWeek(): Promise<void> {
    await this.mealPlan.goToCurrentWeek();
  }
}
