import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SurfaceBannerComponent } from '../../core/images/surface-banner.component';
import type { MealPlanSlot } from '../../core/models/meal-plan-entry';
import { MacroSynthesisSectionComponent } from '../macro-goals/components/macro-synthesis-section/macro-synthesis-section.component';
import { MealSlotSheetComponent } from './components/meal-slot-sheet/meal-slot-sheet.component';
import { RecipePickerSheetComponent } from './components/recipe-picker-sheet/recipe-picker-sheet.component';
import { VariantPickerSheetComponent } from './components/variant-picker-sheet/variant-picker-sheet.component';
import { WeekGridComponent } from './components/week-grid/week-grid.component';
import { MealPlanService } from './services/meal-plan.service';
import { getIsoWeekLabel } from './utils/week-dates';

type SheetMode = 'picker' | 'slot-detail' | 'variant-picker' | null;

interface ActiveSlot {
  date: string;
  slot: MealPlanSlot;
  entryId?: string;
  recipeId?: string;
  recipeTitle?: string;
  resolvedVariantId?: string;
}

@Component({
  selector: 'app-meal-plan-page',
  imports: [
    RouterLink,
    SurfaceBannerComponent,
    WeekGridComponent,
    RecipePickerSheetComponent,
    MealSlotSheetComponent,
    VariantPickerSheetComponent,
    MacroSynthesisSectionComponent,
  ],
  templateUrl: './meal-plan-page.component.html',
  styleUrl: './meal-plan-page.component.scss',
})
export class MealPlanPageComponent implements OnInit {
  protected readonly mealPlan = inject(MealPlanService);

  private readonly synthesisSection = viewChild(MacroSynthesisSectionComponent);
  private readonly mealSlotSheet = viewChild(MealSlotSheetComponent);

  readonly sheetMode = signal<SheetMode>(null);
  readonly activeSlot = signal<ActiveSlot | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly assigning = signal(false);
  readonly updatingVariant = signal(false);

  readonly weekLabel = () => getIsoWeekLabel(this.mealPlan.weekStart());
  readonly selectedSlots = () => this.mealPlan.getSlotsForDate(this.mealPlan.selectedDate());
  readonly selectedDayLabel = () => this.mealPlan.getSelectedDayLabel();

  ngOnInit(): void {
    void this.mealPlan.loadWeek().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Impossible de charger le plan.';
      this.errorMessage.set(message);
    });
  }

  onDaySelected(date: string): void {
    this.mealPlan.selectDate(date);
    void this.synthesisSection()?.reload();
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
        recipeId: slotView?.recipeId,
        recipeTitle: slotView?.recipeTitle ?? 'Recette supprimée',
        resolvedVariantId: slotView?.resolvedVariantId,
      });
      this.sheetMode.set('slot-detail');
      return;
    }

    this.activeSlot.set(selection);
    this.sheetMode.set('picker');
  }

  onVariantChipSelected(selection: {
    date: string;
    slot: MealPlanSlot;
    entryId: string;
    recipeId: string;
    resolvedVariantId: string;
  }): void {
    this.errorMessage.set(null);
    this.activeSlot.set(selection);
    this.sheetMode.set('variant-picker');
  }

  closeSheet(): void {
    this.sheetMode.set(null);
    this.activeSlot.set(null);
    this.errorMessage.set(null);
  }

  async onRecipeSelected(recipeId: string): Promise<void> {
    const slot = this.activeSlot();
    if (!slot || this.assigning()) {
      return;
    }

    this.errorMessage.set(null);
    this.assigning.set(true);

    try {
      if (slot.entryId) {
        await this.mealPlan.changeRecipe(slot.entryId, recipeId);
      } else {
        await this.mealPlan.assignRecipe(slot.date, slot.slot, recipeId);
      }

      this.closeSheet();
      await this.synthesisSection()?.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de planifier ce repas.';
      this.errorMessage.set(message);
    } finally {
      this.assigning.set(false);
    }
  }

  async onVariantSelected(variantId: string): Promise<void> {
    const slot = this.activeSlot();
    if (!slot?.entryId || !slot.recipeId || this.updatingVariant()) {
      return;
    }

    this.errorMessage.set(null);
    this.updatingVariant.set(true);

    try {
      const detail = this.mealPlan.getRecipeDetail(slot.recipeId);
      const recipeVariantId =
        detail && variantId === detail.recipe.defaultVariantId ? null : variantId;

      await this.mealPlan.updateVariant(slot.entryId, recipeVariantId);
      this.closeSheet();
      await this.synthesisSection()?.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de changer la variante.';
      this.errorMessage.set(message);
    } finally {
      this.updatingVariant.set(false);
    }
  }

  openRecipePickerFromSlotDetail(): void {
    if (!this.activeSlot()) {
      return;
    }

    this.errorMessage.set(null);
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
      await this.synthesisSection()?.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer.';
      this.errorMessage.set(message);
      this.mealSlotSheet()?.resetSubmitting();
    }
  }

  scrollToSynthesis(): void {
    document.getElementById('synthesis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async goToPreviousWeek(): Promise<void> {
    await this.mealPlan.goToPreviousWeek();
    await this.synthesisSection()?.reload();
  }

  async goToNextWeek(): Promise<void> {
    await this.mealPlan.goToNextWeek();
    await this.synthesisSection()?.reload();
  }

  async goToCurrentWeek(): Promise<void> {
    await this.mealPlan.goToCurrentWeek();
    await this.synthesisSection()?.reload();
  }
}
