import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { ShellChromeService } from '../../core/layout/shell-chrome.service';
import type { ShoppingListItemWithProduct } from '../../core/models/shopping-list-item';
import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { RegenerateBannerComponent } from './components/regenerate-banner/regenerate-banner.component';
import { ShoppingItemSheetComponent } from './components/shopping-item-sheet/shopping-item-sheet.component';
import { ShoppingRowComponent } from './components/shopping-row/shopping-row.component';
import { StoreModeViewComponent } from './components/store-mode-view/store-mode-view.component';
import { ShoppingListService } from './services/shopping-list.service';

@Component({
  selector: 'app-shopping-list-page',
  imports: [
    EmptyStateComponent,
    RegenerateBannerComponent,
    ShoppingItemSheetComponent,
    ShoppingRowComponent,
    StoreModeViewComponent,
  ],
  templateUrl: './shopping-list-page.component.html',
  styleUrl: './shopping-list-page.component.scss',
})
export class ShoppingListPageComponent implements OnInit, OnDestroy {
  protected readonly shopping = inject(ShoppingListService);
  private readonly shellChrome = inject(ShellChromeService);

  readonly sheetOpen = signal(false);
  readonly editingItem = signal<ShoppingListItemWithProduct | null>(null);
  readonly storeModeActive = signal(false);

  ngOnInit(): void {
    void this.shopping.refresh();
  }

  ngOnDestroy(): void {
    this.exitStoreMode();
  }

  onGenerate(): void {
    void this.shopping.generateFromCurrentWeek();
  }

  onRegenerate(): void {
    void this.shopping.generateFromCurrentWeek();
  }

  enterStoreMode(): void {
    this.storeModeActive.set(true);
    this.shellChrome.setHidden(true);
  }

  exitStoreMode(): void {
    if (!this.storeModeActive()) {
      return;
    }

    this.storeModeActive.set(false);
    this.shellChrome.setHidden(false);
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
