import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import type { ProductReference } from '../../../../core/models/product-reference';
import { ReferenceRowComponent } from '../../../products/components/reference-row/reference-row.component';
import { FoodCategoryLabelComponent } from '../../../../core/ui/food-category-label/food-category-label.component';
import { ProductsService } from '../../../products/services/products.service';

interface ArchivedProductItem {
  product: Product;
  references: ProductReference[];
}

@Component({
  selector: 'app-archived-products-page',
  imports: [RouterLink, ReferenceRowComponent, FoodCategoryLabelComponent],
  templateUrl: './archived-products-page.component.html',
  styleUrl: './archived-products-page.component.scss',
})
export class ArchivedProductsPageComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  readonly items = signal<ArchivedProductItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly restoringId = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async restoreProduct(productId: string): Promise<void> {
    this.restoringId.set(productId);
    this.loadError.set(null);

    try {
      await this.productsService.restoreProduct(productId);
      await this.load();
    } catch {
      this.loadError.set('Restauration impossible. Réessayez.');
    } finally {
      this.restoringId.set(null);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const products = await this.productsService.listArchivedProducts();
      const items = await Promise.all(
        products.map(async (product) => ({
          product,
          references: await this.productsService.listReferences(product.id),
        })),
      );
      this.items.set(items);
    } catch {
      this.loadError.set('Chargement impossible. Réessayez.');
    } finally {
      this.loading.set(false);
    }
  }
}
