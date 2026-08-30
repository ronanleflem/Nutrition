import type { PantryItemWithProduct } from '../../core/models/pantry-item';

import { daysUntilExpiry, isExpiryAlert, parseExpiryDate } from './pantry-expiry.util';

export type PantrySortMode = 'name' | 'expiry';
export type PantryFilterMode = 'all' | 'expiring';

export function filterPantryItems(
  items: PantryItemWithProduct[],
  filter: PantryFilterMode,
  today = new Date(),
): PantryItemWithProduct[] {
  if (filter === 'all') {
    return items;
  }

  return items.filter((item) => isExpiryAlert(item.expiryDate, today));
}

export function sortPantryItems(
  items: PantryItemWithProduct[],
  sort: PantrySortMode,
  today = new Date(),
): PantryItemWithProduct[] {
  const copy = [...items];

  if (sort === 'name') {
    return copy.sort((a, b) => a.productName.localeCompare(b.productName, 'fr'));
  }

  return copy.sort((a, b) => compareByExpiry(a, b, today));
}

export function applyPantryView(
  items: PantryItemWithProduct[],
  sort: PantrySortMode,
  filter: PantryFilterMode,
  today = new Date(),
): PantryItemWithProduct[] {
  return sortPantryItems(filterPantryItems(items, filter, today), sort, today);
}

function compareByExpiry(
  a: PantryItemWithProduct,
  b: PantryItemWithProduct,
  today: Date,
): number {
  const aDate = a.expiryDate ? parseExpiryDate(a.expiryDate) : null;
  const bDate = b.expiryDate ? parseExpiryDate(b.expiryDate) : null;

  if (!aDate && !bDate) {
    return a.productName.localeCompare(b.productName, 'fr');
  }

  if (!aDate) {
    return 1;
  }

  if (!bDate) {
    return -1;
  }

  const aDays = daysUntilExpiry(a.expiryDate!, today);
  const bDays = daysUntilExpiry(b.expiryDate!, today);

  if (aDays === null && bDays === null) {
    return a.productName.localeCompare(b.productName, 'fr');
  }

  if (aDays === null) {
    return 1;
  }

  if (bDays === null) {
    return -1;
  }

  if (aDays !== bDays) {
    return aDays - bDays;
  }

  return a.productName.localeCompare(b.productName, 'fr');
}
