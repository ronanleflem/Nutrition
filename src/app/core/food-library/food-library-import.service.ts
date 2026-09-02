import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import type { Product } from '../models/product';
import type { ProductReference } from '../models/product-reference';
import {
  buildImportPlanFromHit,
  findFoodLibraryDuplicate,
  type FoodLibraryImportResult,
} from './food-library-import';
import { FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS } from './food-library-starter-pack';
import type { FoodSearchHit } from './food-search.types';
import { FoodSearchService } from './food-search.service';

export interface StarterPackImportSummary {
  added: number;
  alreadyPresent: number;
  missing: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class FoodLibraryImportService {
  private readonly database = inject(DatabaseService);
  private readonly foodSearch = inject(FoodSearchService);

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

  async importStarterPack(
    ciqualIds: readonly string[] = FOOD_LIBRARY_STARTER_PACK_CIQUAL_IDS,
  ): Promise<StarterPackImportSummary> {
    await this.foodSearch.ensureLibrariesLoaded();

    let added = 0;
    let alreadyPresent = 0;
    let missing = 0;

    for (const ciqualId of ciqualIds) {
      const hit = this.foodSearch.getCiqualHitById(ciqualId);
      if (!hit) {
        missing += 1;
        continue;
      }

      const result = await this.importFromLibrary(hit);
      if (result.status === 'created') {
        added += 1;
      } else {
        alreadyPresent += 1;
      }
    }

    return {
      added,
      alreadyPresent,
      missing,
      total: ciqualIds.length,
    };
  }
}
