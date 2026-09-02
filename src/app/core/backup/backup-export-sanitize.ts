import type { AppSettings } from '../models/app-settings';

/** Strip API keys from settings before backup export (NFR-21). */
export function sanitizeAppSettingsForExport(settings: AppSettings): AppSettings {
  return {
    ...settings,
    foodRepoApiKey: undefined,
  };
}
