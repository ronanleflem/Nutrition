import { Component, input, output } from '@angular/core';

import { MEAL_PLAN_SLOT_LABELS, type MealPlanSlot } from '../../../../core/models/meal-plan-entry';
import { RecipePhotoThumbComponent } from '../../../../core/images/recipe-photo-thumb.component';
import type { MealPlanSlotView } from '../../services/meal-plan.service';
import type { WeekDay } from '../../utils/week-dates';

@Component({
  selector: 'app-week-grid',
  imports: [RecipePhotoThumbComponent],
  templateUrl: './week-grid.component.html',
  styleUrl: './week-grid.component.scss',
})
export class WeekGridComponent {
  readonly weekDays = input.required<WeekDay[]>();
  readonly selectedDate = input.required<string>();
  readonly slots = input.required<MealPlanSlotView[]>();

  readonly daySelected = output<string>();
  readonly slotSelected = output<{ date: string; slot: MealPlanSlot; entryId?: string }>();
  readonly variantChipSelected = output<{
    date: string;
    slot: MealPlanSlot;
    entryId: string;
    recipeId: string;
    resolvedVariantId: string;
  }>();

  readonly slotLabels = MEAL_PLAN_SLOT_LABELS;

  onDayClick(date: string): void {
    this.daySelected.emit(date);
  }

  onSlotClick(slot: MealPlanSlotView): void {
    this.slotSelected.emit({
      date: this.selectedDate(),
      slot: slot.slot,
      entryId: slot.entry?.id,
    });
  }

  onVariantChipClick(slot: MealPlanSlotView): void {
    if (!slot.entry || !slot.recipeId || !slot.resolvedVariantId) {
      return;
    }

    this.variantChipSelected.emit({
      date: this.selectedDate(),
      slot: slot.slot,
      entryId: slot.entry.id,
      recipeId: slot.recipeId,
      resolvedVariantId: slot.resolvedVariantId,
    });
  }
}
