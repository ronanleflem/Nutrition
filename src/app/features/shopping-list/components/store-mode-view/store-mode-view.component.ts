import { Component, inject, output } from '@angular/core';

import type { ShoppingListItemWithProduct } from '../../../../core/models/shopping-list-item';
import { ShoppingRowComponent } from '../shopping-row/shopping-row.component';
import { ShoppingListService } from '../../services/shopping-list.service';

@Component({
  selector: 'app-store-mode-view',
  imports: [ShoppingRowComponent],
  templateUrl: './store-mode-view.component.html',
  styleUrl: './store-mode-view.component.scss',
})
export class StoreModeViewComponent {
  protected readonly shopping = inject(ShoppingListService);

  readonly finished = output<void>();

  remainingLabel(): string {
    const count = this.shopping.remainingCount();
    return count <= 1 ? `${count} restant` : `${count} restants`;
  }

  onToggleRow(item: ShoppingListItemWithProduct): void {
    void this.shopping.toggleItemChecked(item.id, !item.checked);
  }
}
