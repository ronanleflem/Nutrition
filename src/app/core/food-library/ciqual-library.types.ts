/** Shared types for Ciqual offline food library chunk (build + runtime). */

export type CiqualLibrarySource = 'ciqual';

export interface CiqualFoodEntry {
  id: string;
  nameFr: string;
  category: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  aliases: string[];
}

export interface CiqualFoodLibraryManifest {
  libraryVersion: string;
  source: CiqualLibrarySource;
  generatedAt: string;
  entryCount: number;
}

export interface CiqualFoodLibraryChunk extends CiqualFoodLibraryManifest {
  entries: CiqualFoodEntry[];
}
