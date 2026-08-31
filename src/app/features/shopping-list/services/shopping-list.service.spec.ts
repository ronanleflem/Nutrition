import { TestBed } from '@angular/core/testing';

import type { ShoppingListItemWithProduct } from '../../../core/models/shopping-list-item';
import { ShoppingListService } from './shopping-list.service';

describe('ShoppingListService store mode', () => {
  function item(
    overrides: Partial<ShoppingListItemWithProduct> & Pick<ShoppingListItemWithProduct, 'id' | 'productName'>,
  ): ShoppingListItemWithProduct {
    return {
      productId: 'p1',
      quantityG: 100,
      checked: false,
      source: 'auto',
      createdAt: '2026-08-31T00:00:00.000Z',
      recommendedStores: [],
      ...overrides,
    };
  }

  it('counts remaining unchecked items', () => {
    const service = TestBed.inject(ShoppingListService);
    service.items.set([
      item({ id: '1', productName: 'A', checked: false }),
      item({ id: '2', productName: 'B', checked: true }),
      item({ id: '3', productName: 'C', checked: false }),
    ]);

    expect(service.remainingCount()).toBe(2);
  });

  it('sorts store mode items with unchecked first', () => {
    const service = TestBed.inject(ShoppingListService);
    service.items.set([
      item({ id: '1', productName: 'Zucchini', checked: true }),
      item({ id: '2', productName: 'Avocat', checked: false }),
      item({ id: '3', productName: 'Banane', checked: false }),
      item({ id: '4', productName: 'Riz', checked: true }),
    ]);

    expect(service.storeModeItems().map((entry) => `${entry.productName}:${entry.checked}`)).toEqual([
      'Avocat:false',
      'Banane:false',
      'Riz:true',
      'Zucchini:true',
    ]);
  });
});
