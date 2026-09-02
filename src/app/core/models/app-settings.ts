export const APP_SETTINGS_SINGLETON_ID = 'singleton' as const;

export type AppTheme = 'dark';

export interface AppSettings {
  id: typeof APP_SETTINGS_SINGLETON_ID;
  theme: AppTheme;
  lastExportAt?: string;
  backupReminderDismissedAt?: string;
  shoppingListPlanFingerprint?: string;
  /** Clé API FoodRepo — stockage local uniquement (NFR-21). */
  foodRepoApiKey?: string;
  /** Clé API USDA FoodData Central (api.data.gov) — stockage local uniquement (NFR-21). */
  usdaApiKey?: string;
  /** Si true, les providers online ne s'exécutent qu'après « Rechercher en ligne » (NFR-19). */
  preferManualOnlineSearch?: boolean;
  /** Si true, le cold start ouvre le garde-manger au lieu de l'accueil. */
  hideHomeOnStartup?: boolean;
  /** Réservé à l'onboarding 12.2 — persisté ici, jamais lu par l'accueil. */
  onboardingCompleted?: boolean;
}

export function createDefaultAppSettings(): AppSettings {
  return {
    id: APP_SETTINGS_SINGLETON_ID,
    theme: 'dark',
  };
}
