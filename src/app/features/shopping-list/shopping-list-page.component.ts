import { Component, inject, OnInit, signal } from '@angular/core';

import type { ShoppingListItemWithProduct } from '../../core/models/shopping-list-item';
import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { RegenerateBannerComponent } from './components/regenerate-banner/regenerate-banner.component';
import { ShoppingItemSheetComponent } from './components/shopping-item-sheet/shopping-item-sheet.component';
import { ShoppingRowComponent } from './components/shopping-row/shopping-row.component';
import { ShoppingListService } from './services/shopping-list.service';

@Component({
  selector: 'app-shopping-list-page',
  imports: [
    EmptyStateComponent,
    RegenerateBannerComponent,
    ShoppingItemSheetComponent,
    ShoppingRowComponent,
  ],
  templateUrl: './shopping-list-page.component.html',
  styleUrl: './shopping-list-page.component.scss',
})
export class ShoppingListPageComponent implements OnInit {
  protected readonly shopping = inject(ShoppingListService);

  readonly sheetOpen = signal(false);
  readonly editingItem = signal<ShoppingListItemWithProduct | null>(null);

  ngOnInit(): void {
    void this.shopping.refresh();
  }

  onGenerate(): void {
    void this.shopping.generateFromCurrentWeek();
  }

  onRegenerate(): void {
    void this.shopping.generateFromCurrentWeek();
  }

  openAddSheet(): void {
    this.editingItem.set(null);
    this.sheetOpen.set(true);
  }

  openEditSheet(item: ShoppingListItemWithProduct): void {
    this.editingItem.set(item);
    this.sheetOpen.set(true);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
    this.editingItem.set(null);
  }

  onSheetSaved(): void {
    this.closeSheet();
  }

  onCheckedChange(item: ShoppingListItemWithProduct, checked: boolean): void {
    void this.shopping.toggleItemChecked(item.id, checked);
  }
}
