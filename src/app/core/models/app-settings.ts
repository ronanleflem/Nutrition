export const APP_SETTINGS_SINGLETON_ID = 'singleton' as const;

export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  id: typeof APP_SETTINGS_SINGLETON_ID;
  theme: AppTheme;
  lastExportAt?: string;
  backupReminderDismissedAt?: string;
  shoppingListPlanFingerprint?: string;
}

export function createDefaultAppSettings(): AppSettings {
  return {
    id: APP_SETTINGS_SINGLETON_ID,
    theme: 'dark',
  };
}
