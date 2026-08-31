import { Component, input } from '@angular/core';

import { STORE_LABELS, type Store } from '../../../../core/models/store';
import type { ShoppingListItemWithProduct } from '../../../../core/models/shopping-list-item';

@Component({
  selector: 'app-shopping-row',
  templateUrl: './shopping-row.component.html',
  styleUrl: './shopping-row.component.scss',
})
export class ShoppingRowComponent {
  readonly item = input.required<ShoppingListItemWithProduct>();

  formatQuantity(quantityG: number): string {
    return `${quantityG} g`;
  }

  storeLabel(store: string): string {
    return STORE_LABELS[store as Store] ?? store;
  }
}
