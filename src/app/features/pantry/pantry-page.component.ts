import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import {
  formatDisplayExpiry,
  formatExpiryAlertLabel,
  isExpiryAlert,
} from './pantry-expiry.util';
import type { PantryFilterMode, PantrySortMode } from './pantry-list.util';
import { PantryAddSheetComponent } from './pantry-add-sheet.component';
import { SurfaceBannerComponent } from '../../core/images/surface-banner.component';
import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { PantryService } from './pantry.service';

@Component({
  selector: 'app-pantry-page',
  imports: [PantryAddSheetComponent, EmptyStateComponent, SurfaceBannerComponent],
  templateUrl: './pantry-page.component.html',
  styleUrl: './pantry-page.component.scss',
})
export class PantryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pantry = inject(PantryService);

  readonly sheetOpen = signal(false);
  readonly editingItem = signal<PantryItemWithProduct | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.pantry.setFilterMode(params.get('filter') === 'expiring' ? 'expiring' : 'all');
    });
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
    void this.applyFilter(value);
  }

  showAllItems(): void {
    void this.applyFilter('all');
  }

  private applyFilter(mode: PantryFilterMode): void {
    this.pantry.setFilterMode(mode);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: mode === 'expiring' ? 'expiring' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
