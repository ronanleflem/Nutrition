import { Injectable, computed, inject, signal } from '@angular/core';

import { DatabaseService } from '../../../core/database/database.service';
import type { ShoppingListItemWithProduct } from '../../../core/models/shopping-list-item';
import type { Product } from '../../../core/models/product';
import {
  getIsoWeekLabel,
  getMondayOfWeek,
  getWeekDays,
  toLocalIsoDate,
} from '../../meal-plan/utils/week-dates';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly database = inject(DatabaseService);

  readonly items = signal<ShoppingListItemWithProduct[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly hasPlanEntries = signal(false);
  readonly planStale = signal(false);
  readonly weekLabel = signal(getIsoWeekLabel(getMondayOfWeek(new Date())));

  readonly remainingCount = computed(
    () => this.items().filter((item) => !item.checked).length,
  );

  readonly hasManualItems = computed(() =>
    this.items().some((item) => item.source === 'manual'),
  );

  readonly storeModeItems = computed(() =>
    [...this.items()].sort((left, right) => {
      if (left.checked !== right.checked) {
        return Number(left.checked) - Number(right.checked);
      }

      return left.productName.localeCompare(right.productName, 'fr', { sensitivity: 'base' });
    }),
  );

  private refreshPromise: Promise<void> | null = null;

  async refresh(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.loadState();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async generateFromCurrentWeek(): Promise<void> {
    this.generating.set(true);

    try {
      const { startDate, endDate } = this.getCurrentWeekRange();
      await this.database.generateShoppingListForDateRange(startDate, endDate);
      await this.loadState();
    } finally {
      this.generating.set(false);
    }
  }

  async addManualItem(productId: string, quantityG: number): Promise<{ id: string }> {
    const created = await this.database.createManualShoppingListItem(productId, quantityG);
    await this.loadState();
    return created;
  }

  async createProduct(name: string): Promise<Product> {
    const product = await this.database.createProduct({ name });
    await this.loadState();
    return product;
  }

  async updateItemQuantity(itemId: string, quantityG: number): Promise<void> {
    await this.database.updateShoppingListItem(itemId, { quantityG });
    await this.loadState();
  }

  async toggleItemChecked(itemId: string, checked: boolean): Promise<void> {
    const previous = this.items();
    this.items.update((items) =>
      items.map((item) => (item.id === itemId ? { ...item, checked } : item)),
    );

    try {
      await this.database.updateShoppingListItem(itemId, { checked });
    } catch (error) {
      this.items.set(previous);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.database.deleteShoppingListItem(itemId);
    await this.loadState();
  }

  hasAutoItems(): boolean {
    return this.items().some((item) => item.source === 'auto');
  }

  private async loadState(): Promise<void> {
    this.loading.set(true);

    try {
      const { startDate, endDate } = this.getCurrentWeekRange();
      const weekStart = getMondayOfWeek(new Date());
      this.weekLabel.set(getIsoWeekLabel(weekStart));

      let [items, entries, products, stale] = await Promise.all([
        this.database.listShoppingListItemsWithProducts(),
        this.database.listMealPlanEntriesBetweenDates(startDate, endDate),
        this.database.listActiveProducts(),
        this.database.isShoppingListPlanStale(startDate, endDate),
      ]);

      if (entries.length === 0 && items.some((item) => item.source === 'auto')) {
        await this.database.generateShoppingListForDateRange(startDate, endDate);
        [items, stale] = await Promise.all([
          this.database.listShoppingListItemsWithProducts(),
          this.database.isShoppingListPlanStale(startDate, endDate),
        ]);
      }

      this.items.set(items);
      this.products.set(products);
      this.hasPlanEntries.set(entries.length > 0);
      this.planStale.set(stale);
    } finally {
      this.loading.set(false);
    }
  }

  getCurrentWeekRange(): { startDate: string; endDate: string } {
    const weekDays = getWeekDays(getMondayOfWeek(new Date()));
    return {
      startDate: weekDays[0].date,
      endDate: weekDays[6].date,
    };
  }

  getTodayIsoDate(): string {
    return toLocalIsoDate(new Date());
  }
}
