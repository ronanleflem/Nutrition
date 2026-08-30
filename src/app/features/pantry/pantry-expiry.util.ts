import type { PantryItemWithProduct } from '../../core/models/pantry-item';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function parseExpiryDate(expiryDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiryDate.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function daysUntilExpiry(expiryDate: string, today = new Date()): number | null {
  const expiry = parseExpiryDate(expiryDate);
  if (!expiry) {
    return null;
  }

  const diffMs = startOfLocalDay(expiry).getTime() - startOfLocalDay(today).getTime();
  return Math.round(diffMs / MS_PER_DAY);
}

/** True when DLC is set and within ≤ 3 calendar days (includes today and past dates). */
export function isExpiryAlert(expiryDate?: string, today = new Date()): boolean {
  if (!expiryDate) {
    return false;
  }

  const days = daysUntilExpiry(expiryDate, today);
  return days !== null && days <= 3;
}

export function formatExpiryAlertLabel(expiryDate: string, today = new Date()): string {
  const days = daysUntilExpiry(expiryDate, today);
  if (days === null) {
    return 'DLC proche';
  }

  if (days < 0) {
    return 'DLC expirée';
  }

  if (days === 0) {
    return 'DLC aujourd’hui';
  }

  if (days === 1) {
    return 'DLC dans 1 jour';
  }

  return `DLC dans ${days} jours`;
}

export function formatDisplayExpiry(expiryDate?: string): string | null {
  if (!expiryDate) {
    return null;
  }

  const parsed = parseExpiryDate(expiryDate);
  if (!parsed) {
    return expiryDate;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
