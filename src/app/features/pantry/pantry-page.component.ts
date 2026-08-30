import { Component, inject, OnInit, signal } from '@angular/core';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import {
  formatDisplayExpiry,
  formatExpiryAlertLabel,
  isExpiryAlert,
} from './pantry-expiry.util';
import type { PantryFilterMode, PantrySortMode } from './pantry-list.util';
import { PantryAddSheetComponent } from './pantry-add-sheet.component';
import { PantryService } from './pantry.service';

@Component({
  selector: 'app-pantry-page',
  imports: [PantryAddSheetComponent],
  templateUrl: './pantry-page.component.html',
  styleUrl: './pantry-page.component.scss',
})
export class PantryPageComponent implements OnInit {
  protected readonly pantry = inject(PantryService);

  readonly sheetOpen = signal(false);
  readonly editingItem = signal<PantryItemWithProduct | null>(null);

  ngOnInit(): void {
    void this.pantry.refresh();
  }

  openAddSheet(): void {
    this.editingItem.set(null);
    this.sheetOpen.set(true);
  }

  openEditSheet(item: PantryItemWithProduct): void {
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

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PantrySortMode;
    this.pantry.setSortMode(value);
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PantryFilterMode;
    this.pantry.setFilterMode(value);
  }

  showAllItems(): void {
    this.pantry.setFilterMode('all');
  }

  formatQuantity(quantityG: number): string {
    return `${quantityG} g`;
  }

  formatExpiry(expiryDate?: string): string | null {
    return formatDisplayExpiry(expiryDate);
  }

  hasExpiryAlert(expiryDate?: string): boolean {
    return isExpiryAlert(expiryDate);
  }

  expiryAlertLabel(expiryDate: string): string {
    return formatExpiryAlertLabel(expiryDate);
  }
}
