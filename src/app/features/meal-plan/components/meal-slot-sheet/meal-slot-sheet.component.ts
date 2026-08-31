import { Component, input, output, signal } from '@angular/core';

import { MEAL_PLAN_SLOT_LABELS, type MealPlanSlot } from '../../../../core/models/meal-plan-entry';

@Component({
  selector: 'app-meal-slot-sheet',
  templateUrl: './meal-slot-sheet.component.html',
  styleUrl: './meal-slot-sheet.component.scss',
})
export class MealSlotSheetComponent {
  readonly slot = input.required<MealPlanSlot>();
  readonly recipeTitle = input.required<string>();
  readonly closed = output<void>();
  readonly changeRecipe = output<void>();
  readonly deleted = output<void>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly slotLabel = () => MEAL_PLAN_SLOT_LABELS[this.slot()];

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  async deleteEntry(): Promise<void> {
    this.errorMessage.set(null);
    this.submitting.set(true);

    try {
      this.deleted.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer.';
      this.errorMessage.set(message);
      this.submitting.set(false);
    }
  }
}
