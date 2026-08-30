import Dexie, { type EntityTable } from 'dexie';

import type { AppSettings } from '../models/app-settings';

export const NUTRITION_DB_NAME = 'NutritionDb';
export const NUTRITION_DB_VERSION = 1;

export class NutritionDatabase extends Dexie {
  appSettings!: EntityTable<AppSettings, 'id'>;

  constructor(name = NUTRITION_DB_NAME) {
    super(name);
    this.version(NUTRITION_DB_VERSION).stores({
      appSettings: 'id',
    });
  }
}
