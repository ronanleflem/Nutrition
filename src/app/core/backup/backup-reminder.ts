import type { AppSettings } from '../models/app-settings';

export const BACKUP_REMINDER_STALE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(isoDate: string, now = new Date()): number {
  return (now.getTime() - new Date(isoDate).getTime()) / MS_PER_DAY;
}

export function isBackupStale(lastExportAt: string | undefined, now = new Date()): boolean {
  if (!lastExportAt) {
    return true;
  }

  return daysSince(lastExportAt, now) >= BACKUP_REMINDER_STALE_DAYS;
}

export function shouldShowBackupReminder(settings: AppSettings, now = new Date()): boolean {
  if (!isBackupStale(settings.lastExportAt, now)) {
    return false;
  }

  if (!settings.backupReminderDismissedAt) {
    return true;
  }

  return daysSince(settings.backupReminderDismissedAt, now) >= BACKUP_REMINDER_STALE_DAYS;
}
