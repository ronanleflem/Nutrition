import { Component, computed, input, output, signal } from '@angular/core';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { MEAL_PLAN_SLOT_LABELS, type MealPlanSlot } from '../../../../core/models/meal-plan-entry';

@Component({
  selector: 'app-meal-slot-sheet',
  imports: [ConfirmDialogComponent],
  templateUrl: './meal-slot-sheet.component.html',
  styleUrl: './meal-slot-sheet.component.scss',
})
export class MealSlotSheetComponent {
  readonly slot = input.required<MealPlanSlot>();
  readonly recipeTitle = input.required<string>();
  readonly pageError = input<string | null>(null);
  readonly closed = output<void>();
  readonly changeRecipe = output<void>();
  readonly deleted = output<void>();

  readonly submitting = signal(false);
  readonly localError = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);

  readonly slotLabel = () => MEAL_PLAN_SLOT_LABELS[this.slot()];

  readonly displayedError = computed(() => this.pageError() ?? this.localError());

  readonly deleteConfirmMessage = computed(
    () => `Supprimer « ${this.recipeTitle()} » de ce créneau ?`,
  );

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  openDeleteConfirm(): void {
    this.localError.set(null);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    this.localError.set(null);
    this.submitting.set(true);
    this.showDeleteConfirm.set(false);
    this.deleted.emit();
  }

  resetSubmitting(): void {
    this.submitting.set(false);
  }
}
