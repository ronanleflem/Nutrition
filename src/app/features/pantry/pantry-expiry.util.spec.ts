import { describe, expect, it } from 'vitest';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import {
  daysUntilExpiry,
  formatExpiryAlertLabel,
  isExpiryAlert,
} from './pantry-expiry.util';

const TODAY = new Date(2026, 7, 30);

function ymdOffset(days: number): string {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('pantry-expiry.util', () => {
  it('returns true when DLC is within 3 days', () => {
    expect(isExpiryAlert(ymdOffset(3), TODAY)).toBe(true);
    expect(isExpiryAlert(ymdOffset(0), TODAY)).toBe(true);
  });

  it('returns false when DLC is more than 3 days away', () => {
    expect(isExpiryAlert(ymdOffset(4), TODAY)).toBe(false);
  });

  it('returns false when DLC is missing', () => {
    expect(isExpiryAlert(undefined, TODAY)).toBe(false);
  });

  it('alerts for expired DLC', () => {
    expect(isExpiryAlert(ymdOffset(-1), TODAY)).toBe(true);
    expect(formatExpiryAlertLabel(ymdOffset(-1), TODAY)).toBe('DLC expirée');
  });

  it('formats alert labels for near dates', () => {
    expect(formatExpiryAlertLabel(ymdOffset(0), TODAY)).toBe('DLC aujourd’hui');
    expect(formatExpiryAlertLabel(ymdOffset(1), TODAY)).toBe('DLC dans 1 jour');
    expect(formatExpiryAlertLabel(ymdOffset(3), TODAY)).toBe('DLC dans 3 jours');
  });

  it('computes calendar day differences', () => {
    expect(daysUntilExpiry(ymdOffset(5), TODAY)).toBe(5);
  });
});
