import { inject, Injectable, signal } from '@angular/core';

import type { ProductCatalogItem } from '../../../core/models/product-catalog';
import type {
  CreateProductReferenceInput,
  ProductReference,
  UpdateProductReferenceInput,
} from '../../../core/models/product-reference';
import type { CreateProductInput, Product, UpdateProductInput } from '../../../core/models/product';
import { DatabaseService } from '../../../core/database/database.service';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly database = inject(DatabaseService);

  readonly catalog = signal<ProductCatalogItem[]>([]);
  readonly loading = signal(false);

  async loadCatalog(): Promise<void> {
    this.loading.set(true);

    try {
      const items = await this.database.listProductCatalog();
      this.catalog.set(items);
    } finally {
      this.loading.set(false);
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.database.getProduct(id);
  }

  async getProductIncludingArchived(id: string): Promise<Product | undefined> {
    return this.database.getProductIncludingArchived(id);
  }

  async getProductCatalogItem(productId: string): Promise<ProductCatalogItem | undefined> {
    return this.database.getProductCatalogItem(productId);
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const product = await this.database.createProduct(input);
    await this.loadCatalog();
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.database.updateProduct(id, input);
    await this.loadCatalog();
    return product;
  }

  async listReferences(productId: string): Promise<ProductReference[]> {
    return this.database.listActiveReferencesByProductId(productId);
  }

  async getReference(id: string): Promise<ProductReference | undefined> {
    return this.database.getProductReference(id);
  }

  async createReference(input: CreateProductReferenceInput): Promise<ProductReference> {
    const reference = await this.database.createProductReference(input);
    await this.loadCatalog();
    return reference;
  }

  async updateReference(id: string, input: UpdateProductReferenceInput): Promise<ProductReference> {
    const reference = await this.database.updateProductReference(id, input);
    await this.loadCatalog();
    return reference;
  }

  async setPreferredReference(productId: string, referenceId: string): Promise<Product> {
    const product = await this.database.setPreferredReference(productId, referenceId);
    await this.loadCatalog();
    return product;
  }

  async archiveProduct(id: string): Promise<Product> {
    const product = await this.database.archiveProduct(id);
    await this.loadCatalog();
    return product;
  }

  async restoreProduct(id: string): Promise<Product> {
    const product = await this.database.restoreProduct(id);
    await this.loadCatalog();
    return product;
  }

  async listArchivedProducts(): Promise<Product[]> {
    return this.database.listArchivedProducts();
  }

  async getReferenceByBarcode(barcode: string): Promise<ProductReference | undefined> {
    return this.database.getActiveReferenceByBarcode(barcode);
  }
}
