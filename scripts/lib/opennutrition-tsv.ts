/** TSV row parsing for OpenNutrition foods dataset. */

export const OPENNUTRITION_TSV_COLUMNS = [
  'id',
  'name',
  'alternate_names',
  'description',
  'type',
  'source',
  'serving',
  'nutrition_100g',
  'ean_13',
  'labels',
  'package_size',
  'ingredients',
  'ingredient_analysis',
] as const;

export type OpenNutritionTsvColumn = (typeof OPENNUTRITION_TSV_COLUMNS)[number];

export type OpenNutritionTsvRow = Record<OpenNutritionTsvColumn, string>;

export function parseTsvLine(line: string): OpenNutritionTsvRow | null {
  const parts = line.split('\t');
  if (parts.length !== OPENNUTRITION_TSV_COLUMNS.length) {
    return null;
  }

  const row = {} as OpenNutritionTsvRow;
  for (let index = 0; index < OPENNUTRITION_TSV_COLUMNS.length; index += 1) {
    row[OPENNUTRITION_TSV_COLUMNS[index]] = parts[index] ?? '';
  }
  return row;
}

export function parseJsonField<T>(raw: string): T | undefined {
  if (!raw.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
