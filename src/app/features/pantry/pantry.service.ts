import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService, type PantryItemInput } from '../../core/database/database.service';
import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import type { Product } from '../../core/models/product';

@Injectable({ providedIn: 'root' })
export class PantryService {
  private readonly database = inject(DatabaseService);

  readonly items = signal<PantryItemWithProduct[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);

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

  private async loadPantryState(): Promise<void> {
    this.loading.set(true);
    try {
      const [items, products] = await Promise.all([
        this.database.listPantryItemsWithProducts(),
        this.database.listActiveProducts(),
      ]);
      this.items.set(items);
      this.products.set(products);
    } finally {
      this.loading.set(false);
    }
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
