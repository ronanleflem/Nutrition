import { Component, input, output } from '@angular/core';

import { STORE_LABELS, type Store } from '../../../../core/models/store';
import type { ShoppingListItemWithProduct } from '../../../../core/models/shopping-list-item';

@Component({
  selector: 'app-shopping-row',
  templateUrl: './shopping-row.component.html',
  styleUrl: './shopping-row.component.scss',
})
export class ShoppingRowComponent {
  readonly item = input.required<ShoppingListItemWithProduct>();
  readonly checkedChange = output<boolean>();
  readonly edit = output<void>();

  formatQuantity(quantityG: number): string {
    return `${quantityG} g`;
  }

  storeLabel(store: string): string {
    return STORE_LABELS[store as Store] ?? store;
  }

  onCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(checked);
  }

  onEditClick(): void {
    this.edit.emit();
  }
}
