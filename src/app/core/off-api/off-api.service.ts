import { Injectable } from '@angular/core';

import { OFF_API_ORIGIN } from '../pwa/off-api-origin';
import { mapOffProductFields } from './off-product-mapper';
import type { OffLookupResult, OffProductPrefill } from './off-product-prefill';

interface OffApiResponse {
  status: number;
  code: string;
  product?: {
    product_name?: string;
    product_name_fr?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_fr?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

@Injectable({ providedIn: 'root' })
export class OffApiService {
  private readonly sessionCache = new Map<string, OffLookupResult>();

  async lookupProduct(barcode: string): Promise<OffLookupResult> {
    const cached = this.sessionCache.get(barcode);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${OFF_API_ORIGIN}/api/v2/product/${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return { status: 'network_error', barcode };
      }

      const payload = (await response.json()) as OffApiResponse;
      if (payload.status !== 1 || !payload.product) {
        const result: OffLookupResult = { status: 'not_found', barcode };
        this.sessionCache.set(barcode, result);
        return result;
      }

      const prefill = mapOffProduct(barcode, payload.product);
      const result: OffLookupResult = { status: 'found', prefill };
      this.sessionCache.set(barcode, result);
      return result;
    } catch {
      return { status: 'network_error', barcode };
    }
  }

  clearSessionCache(): void {
    this.sessionCache.clear();
  }
}

function mapOffProduct(
  barcode: string,
  product: NonNullable<OffApiResponse['product']>,
): OffProductPrefill {
  return mapOffProductFields(barcode, product);
}
