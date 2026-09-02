import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import {
  sortReferencesForDisplay,
  type ProductCatalogItem,
} from '../../../../core/models/product-catalog';
import type { ProductReference } from '../../../../core/models/product-reference';
import { STORE_LABELS } from '../../../../core/models/store';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { ReferenceRowComponent } from '../reference-row/reference-row.component';
import { FoodCategoryLabelComponent } from '../../../../core/ui/food-category-label/food-category-label.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, PriorityBadgeComponent, ReferenceRowComponent, ConfirmDialogComponent, FoodCategoryLabelComponent],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);

  readonly catalogItem = signal<ProductCatalogItem | undefined>(undefined);
  readonly references = signal<ProductReference[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly showArchiveConfirm = signal(false);
  readonly archiving = signal(false);

  private productId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loadError.set('Produit introuvable.');
        this.loading.set(false);
        return;
      }

      void this.load(id);
    });
  }

  storeLabel(store: string | undefined): string {
    if (!store) {
      return '';
    }

    return STORE_LABELS[store as keyof typeof STORE_LABELS] ?? store;
  }

  async onSetPreferred(referenceId: string): Promise<void> {
    if (!this.productId) {
      return;
    }

    try {
      await this.productsService.setPreferredReference(this.productId, referenceId);
      await this.load(this.productId);
    } catch {
      this.loadError.set('Préférence non enregistrée. Réessayez.');
    }
  }

  openArchiveConfirm(): void {
    this.showArchiveConfirm.set(true);
  }

  closeArchiveConfirm(): void {
    this.showArchiveConfirm.set(false);
  }

  async confirmArchive(): Promise<void> {
    if (!this.productId || this.archiving()) {
      return;
    }

    this.archiving.set(true);

    try {
      await this.productsService.archiveProduct(this.productId);
      this.showArchiveConfirm.set(false);
      await this.router.navigate(['/products']);
    } catch {
      this.loadError.set('Archivage impossible. Réessayez.');
    } finally {
      this.archiving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.productId = id;

    try {
      const [item, references] = await Promise.all([
        this.productsService.getProductCatalogItem(id),
        this.productsService.listReferences(id),
      ]);

      if (!item) {
        this.loadError.set('Produit introuvable.');
        return;
      }

      this.catalogItem.set(item);
      this.references.set(sortReferencesForDisplay(references));
    } finally {
      this.loading.set(false);
    }
  }
}
