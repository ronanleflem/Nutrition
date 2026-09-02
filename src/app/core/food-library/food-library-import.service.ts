import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';
import {
  buildImportPlanFromHit,
  findFoodLibraryDuplicate,
  type FoodLibraryImportResult,
} from './food-library-import';
import type { FoodSearchHit } from './food-search.types';

@Injectable({ providedIn: 'root' })
export class FoodLibraryImportService {
  private readonly database = inject(DatabaseService);

  async importFromLibrary(
    hit: FoodSearchHit,
    options?: { forceCreate?: boolean },
  ): Promise<FoodLibraryImportResult> {
    const catalog = await this.database.listProductCatalog();

    const barcodeMatch = hit.barcode
      ? await this.database.findReferenceByBarcode(hit.barcode)
      : undefined;

    if (!options?.forceCreate) {
      const duplicate = findFoodLibraryDuplicate(hit, catalog, barcodeMatch);
      if (duplicate) {
        return { status: 'duplicate', match: duplicate };
      }
    }

    const plan = buildImportPlanFromHit(hit);
    const product = await this.database.createProduct(plan.product);
    const reference = await this.database.createProductReference({
      productId: product.id,
      ...plan.reference,
    });
    const updatedProduct = await this.database.setPreferredReference(product.id, reference.id);

    return { status: 'created', product: updatedProduct, reference };
  }

  async importOrGetExisting(
    hit: FoodSearchHit,
    resolution: 'use_existing' | 'create_new',
    duplicate?: FoodLibraryImportResult & { status: 'duplicate' },
  ): Promise<{ product: Product; reference?: ProductReference; created: boolean }> {
    if (resolution === 'use_existing' && duplicate?.status === 'duplicate') {
      return {
        product: duplicate.match.existingProduct,
        reference: duplicate.match.existingReference,
        created: false,
      };
    }

    const result = await this.importFromLibrary(hit, { forceCreate: true });
    if (result.status !== 'created') {
      throw new Error('Import forcé impossible.');
    }

    return {
      product: result.product,
      reference: result.reference,
      created: true,
    };
  }
}
