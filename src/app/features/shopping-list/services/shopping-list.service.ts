import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from '../../../core/database/database.service';
import type { ShoppingListItemWithProduct } from '../../../core/models/shopping-list-item';
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
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly hasPlanEntries = signal(false);
  readonly weekLabel = signal(getIsoWeekLabel(getMondayOfWeek(new Date())));

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
      const weekStart = getMondayOfWeek(new Date());
      const weekDays = getWeekDays(weekStart);
      const startDate = weekDays[0].date;
      const endDate = weekDays[6].date;

      await this.database.generateShoppingListForDateRange(startDate, endDate);
      await this.loadState();
    } finally {
      this.generating.set(false);
    }
  }

  private async loadState(): Promise<void> {
    this.loading.set(true);

    try {
      const weekStart = getMondayOfWeek(new Date());
      const weekDays = getWeekDays(weekStart);
      const startDate = weekDays[0].date;
      const endDate = weekDays[6].date;

      this.weekLabel.set(getIsoWeekLabel(weekStart));

      const [items, entries] = await Promise.all([
        this.database.listShoppingListItemsWithProducts(),
        this.database.listMealPlanEntriesBetweenDates(startDate, endDate),
      ]);

      this.items.set(items);
      this.hasPlanEntries.set(entries.length > 0);
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
