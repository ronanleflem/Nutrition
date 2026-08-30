import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService, type PantryItemInput } from '../../core/database/database.service';
import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import type { Product } from '../../core/models/product';
import {
  applyPantryView,
  type PantryFilterMode,
  type PantrySortMode,
} from './pantry-list.util';

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly database = inject(DatabaseService);

  readonly items = signal<PantryItemWithProduct[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly sortMode = signal<PantrySortMode>('name');
  readonly filterMode = signal<PantryFilterMode>('all');
  readonly displayItems = signal<PantryItemWithProduct[]>([]);

  private refreshPromise: Promise<void> | null = null;

  async refresh(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.loadPantryState();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  setSortMode(mode: PantrySortMode): void {
    this.sortMode.set(mode);
    this.recomputeDisplayItems();
  }

  setFilterMode(mode: PantryFilterMode): void {
    this.filterMode.set(mode);
    this.recomputeDisplayItems();
  }

  private async loadPantryState(): Promise<void> {
    this.loading.set(true);
    try {
      const [items, products] = await Promise.all([
        this.database.listPantryItemsWithProducts(),
        this.database.listActiveProducts(),
      ]);
      this.items.set(items);
      this.products.set(products);
      this.recomputeDisplayItems();
    } finally {
      this.loading.set(false);
    }
  }

  private recomputeDisplayItems(): void {
    this.displayItems.set(
      applyPantryView(this.items(), this.sortMode(), this.filterMode()),
    );
  }

  async createProduct(name: string): Promise<Product> {
    const product = await this.database.createProduct(name);
    await this.refresh();
    return product;
  }

  async addItem(input: PantryItemInput): Promise<void> {
    await this.database.addPantryItem(input);
    await this.refresh();
  }

  async updateItem(
    itemId: string,
    update: { quantityG?: number; expiryDate?: string | null; location?: string | null },
  ): Promise<void> {
    await this.database.updatePantryItem(itemId, update);
    await this.refresh();
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.database.deletePantryItem(itemId);
    await this.refresh();
  }
}
