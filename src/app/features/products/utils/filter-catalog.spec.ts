import type { ProductCatalogItem } from '../../../core/models/product-catalog';
import { filterCatalogByProductName } from './filter-catalog';

describe('filterCatalogByProductName', () => {
  const items: ProductCatalogItem[] = [
    {
      product: {
        id: '1',
        name: 'Skyr nature',
        recommendedStores: [],
        createdAt: '',
        updatedAt: '',
      },
    },
    {
      product: {
        id: '2',
        name: 'Poulet blanc',
        recommendedStores: [],
        createdAt: '',
        updatedAt: '',
      },
    },
    {
      product: {
        id: '3',
        name: 'Épinards',
        recommendedStores: [],
        createdAt: '',
        updatedAt: '',
      },
    },
  ];

  it('returns all items when query is empty', () => {
    expect(filterCatalogByProductName(items, '')).toHaveLength(3);
    expect(filterCatalogByProductName(items, '   ')).toHaveLength(3);
  });

  it('filters by product name case-insensitively', () => {
    expect(filterCatalogByProductName(items, 'skyr').map((item) => item.product.name)).toEqual([
      'Skyr nature',
    ]);
    expect(filterCatalogByProductName(items, 'POULET').map((item) => item.product.name)).toEqual([
      'Poulet blanc',
    ]);
  });

  it('matches accented characters with French locale rules', () => {
    expect(filterCatalogByProductName(items, 'epinard').map((item) => item.product.name)).toEqual([
      'Épinards',
    ]);
  });
});
