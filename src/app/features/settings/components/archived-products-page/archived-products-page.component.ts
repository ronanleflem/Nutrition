import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import { ProductsService } from '../../../products/services/products.service';

@Component({
  selector: 'app-archived-products-page',
  imports: [RouterLink],
  templateUrl: './archived-products-page.component.html',
  styleUrl: './archived-products-page.component.scss',
})
export class ArchivedProductsPageComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly restoringId = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async restoreProduct(productId: string): Promise<void> {
    this.restoringId.set(productId);

    try {
      await this.productsService.restoreProduct(productId);
      await this.load();
    } finally {
      this.restoringId.set(null);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      const products = await this.productsService.listArchivedProducts();
      this.products.set(products);
    } finally {
      this.loading.set(false);
    }
  }
}
