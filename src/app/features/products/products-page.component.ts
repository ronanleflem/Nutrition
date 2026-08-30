import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductsService } from './services/products.service';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, ProductCardComponent, EmptyStateComponent],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  readonly catalog = this.productsService.catalog;
  readonly loading = this.productsService.loading;

  ngOnInit(): void {
    void this.productsService.loadCatalog();
  }
}
