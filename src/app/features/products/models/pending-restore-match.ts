import type { Product } from '../../../core/models/product';
import type { ProductReference } from '../../../core/models/product-reference';

export interface PendingRestoreMatch {
  product: Product;
  reference: ProductReference;
}
