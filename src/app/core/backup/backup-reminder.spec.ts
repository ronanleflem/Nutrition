import { describe, expect, it } from 'vitest';

import { APP_SETTINGS_SINGLETON_ID } from '../models/app-settings';
import {
  BACKUP_REMINDER_STALE_DAYS,
  isBackupStale,
  shouldShowBackupReminder,
} from './backup-reminder';

describe('backup-reminder', () => {
  const now = new Date('2026-09-01T12:00:00.000Z');

  it('treats missing lastExportAt as stale', () => {
    expect(isBackupStale(undefined, now)).toBe(true);
  });

  it('is not stale when export is recent', () => {
    const recent = new Date(now);
    recent.setDate(recent.getDate() - (BACKUP_REMINDER_STALE_DAYS - 1));

    expect(isBackupStale(recent.toISOString(), now)).toBe(false);
  });

  it('is stale when export is older than 30 days', () => {
    const old = new Date(now);
    old.setDate(old.getDate() - BACKUP_REMINDER_STALE_DAYS);

    expect(isBackupStale(old.toISOString(), now)).toBe(true);
  });

  it('shows reminder when stale and not dismissed', () => {
    expect(
      shouldShowBackupReminder(
        { id: APP_SETTINGS_SINGLETON_ID, theme: 'dark' },
        now,
      ),
    ).toBe(true);
  });

  it('hides reminder after recent export', () => {
    expect(
      shouldShowBackupReminder(
        {
          id: APP_SETTINGS_SINGLETON_ID,
          theme: 'dark',
          lastExportAt: '2026-08-31T00:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('hides reminder after dismiss until snooze period ends', () => {
    expect(
      shouldShowBackupReminder(
        {
          id: APP_SETTINGS_SINGLETON_ID,
          theme: 'dark',
          backupReminderDismissedAt: '2026-08-20T00:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('shows reminder again after dismiss snooze expires while still stale', () => {
    const dismissed = new Date(now);
    dismissed.setDate(dismissed.getDate() - BACKUP_REMINDER_STALE_DAYS);

    expect(
      shouldShowBackupReminder(
        {
          id: APP_SETTINGS_SINGLETON_ID,
          theme: 'dark',
          lastExportAt: '2026-01-01T00:00:00.000Z',
          backupReminderDismissedAt: dismissed.toISOString(),
        },
        now,
      ),
    ).toBe(true);
  });
});
