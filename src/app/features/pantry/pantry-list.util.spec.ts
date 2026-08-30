import { describe, expect, it } from 'vitest';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import { applyPantryView, filterPantryItems, sortPantryItems } from './pantry-list.util';

const TODAY = new Date(2026, 7, 30);

function item(
  id: string,
  name: string,
  expiryDate?: string,
): PantryItemWithProduct {
  return {
    id,
    productId: `p-${id}`,
    productName: name,
    quantityG: 100,
    expiryDate,
    updatedAt: '2026-08-30T00:00:00.000Z',
  };
}

function ymdOffset(days: number): string {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('pantry-list.util', () => {
  const items = [
    item('1', 'Bananes', ymdOffset(10)),
    item('2', 'Lait', ymdOffset(2)),
    item('3', 'Riz'),
  ];

  it('filters expiring items only', () => {
    const filtered = filterPantryItems(items, 'expiring', TODAY);
    expect(filtered.map((row) => row.id)).toEqual(['2']);
  });

  it('sorts by name in French locale order', () => {
    const sorted = sortPantryItems(items, 'name', TODAY);
    expect(sorted.map((row) => row.productName)).toEqual(['Bananes', 'Lait', 'Riz']);
  });

  it('sorts by DLC with undated items last', () => {
    const sorted = sortPantryItems(items, 'expiry', TODAY);
    expect(sorted.map((row) => row.id)).toEqual(['2', '1', '3']);
  });

  it('applies filter then sort', () => {
    const view = applyPantryView(items, 'name', 'expiring', TODAY);
    expect(view.map((row) => row.productName)).toEqual(['Lait']);
  });
});
