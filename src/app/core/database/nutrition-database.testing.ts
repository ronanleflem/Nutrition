import Dexie from 'dexie';

import { NUTRITION_DB_NAME } from './nutrition-database';

/** Test-only helper — not part of the production DatabaseService API. */
export async function deleteNutritionDatabase(name = NUTRITION_DB_NAME): Promise<void> {
  await Dexie.delete(name);
}
