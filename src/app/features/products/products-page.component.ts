import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductsService } from './services/products.service';
import { filterCatalogByProductName } from './utils/filter-catalog';

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
  readonly searchQuery = signal('');

  readonly filteredCatalog = computed(() =>
    filterCatalogByProductName(this.catalog(), this.searchQuery()),
  );

  readonly hasCatalog = computed(() => this.catalog().length > 0);
  readonly hasSearchQuery = computed(() => this.searchQuery().trim().length > 0);
  readonly hasFilteredResults = computed(() => this.filteredCatalog().length > 0);

  ngOnInit(): void {
    void this.productsService.loadCatalog();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
