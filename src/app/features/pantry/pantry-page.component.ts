import { Component, inject, OnInit, signal } from '@angular/core';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
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

  formatQuantity(quantityG: number): string {
    return `${quantityG} g`;
  }

  formatExpiry(expiryDate?: string): string | null {
    if (!expiryDate) {
      return null;
    }

    const date = new Date(expiryDate);
    if (Number.isNaN(date.getTime())) {
      return expiryDate;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
