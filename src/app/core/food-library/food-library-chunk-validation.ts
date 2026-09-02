import type { CiqualFoodLibraryChunk } from './ciqual-library.types';
import type { OpenNutritionFoodLibraryChunk } from './opennutrition-library.types';

function assertChunkShape(
  chunk: unknown,
  source: 'ciqual' | 'opennutrition',
  label: string,
): void {
  if (!chunk || typeof chunk !== 'object') {
    throw new Error(`${label} : format JSON invalide.`);
  }

  const record = chunk as Record<string, unknown>;

  if (record['source'] !== source) {
    throw new Error(`${label} : source attendue « ${source} ».`);
  }

  if (!Array.isArray(record['entries'])) {
    throw new Error(`${label} : tableau entries manquant.`);
  }

  const entryCount = record['entryCount'];
  const entries = record['entries'] as unknown[];

  if (typeof entryCount === 'number' && entryCount !== entries.length) {
    throw new Error(
      `${label} : entryCount (${entryCount}) ne correspond pas aux entrées (${entries.length}).`,
    );
  }
}

export function parseCiqualChunk(chunk: unknown): CiqualFoodLibraryChunk {
  assertChunkShape(chunk, 'ciqual', 'Chunk Ciqual');
  return chunk as CiqualFoodLibraryChunk;
}

export function parseOpenNutritionChunk(chunk: unknown): OpenNutritionFoodLibraryChunk {
  assertChunkShape(chunk, 'opennutrition', 'Chunk OpenNutrition');
  return chunk as OpenNutritionFoodLibraryChunk;
}
