import { inject, Injectable, signal } from '@angular/core';

import { DatabaseService } from '../../../core/database/database.service';
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '../../../core/models/product';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly database = inject(DatabaseService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);

  async loadProducts(): Promise<void> {
    this.loading.set(true);

    try {
      const products = await this.database.listActiveProducts();
      this.products.set(products);
    } finally {
      this.loading.set(false);
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.database.getProduct(id);
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const product = await this.database.createProduct(input);
    await this.loadProducts();
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.database.updateProduct(id, input);
    await this.loadProducts();
    return product;
  }
}
