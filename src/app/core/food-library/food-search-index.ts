import { isValidEan, normalizeBarcodeInput } from '../barcode/ean';
import type { CiqualFoodEntry, CiqualFoodLibraryChunk } from './ciqual-library.types';
import {
  FOOD_LIBRARY_SOURCE_LABELS,
  type FoodSearchHit,
  type FoodSearchSection,
} from './food-search.types';
import { matchesFoodSearchQuery, normalizeFoodSearchText } from './normalize-food-search';
import type {
  OpenNutritionFoodEntry,
  OpenNutritionFoodLibraryChunk,
} from './opennutrition-library.types';

const DEFAULT_LIMIT_PER_SECTION = 25;

interface IndexedCiqualEntry {
  entry: CiqualFoodEntry;
  searchText: string;
}

interface IndexedOpenNutritionEntry {
  entry: OpenNutritionFoodEntry;
  searchText: string;
}

export function buildCiqualSearchText(entry: CiqualFoodEntry): string {
  return normalizeFoodSearchText([entry.nameFr, entry.category, ...entry.aliases].join(' '));
}

export function buildOpenNutritionSearchText(entry: OpenNutritionFoodEntry): string {
  return normalizeFoodSearchText([entry.name, entry.brand ?? '', entry.barcode ?? ''].join(' '));
}

export function toCiqualHit(entry: CiqualFoodEntry): FoodSearchHit {
  return {
    source: 'ciqual',
    sourceLabel: FOOD_LIBRARY_SOURCE_LABELS.ciqual,
    id: entry.id,
    displayName: entry.nameFr,
    subtitle: entry.category,
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    fatG: entry.fatG,
    carbsG: entry.carbsG,
    fiberG: entry.fiberG,
    ciqualEntry: entry,
  };
}

export function toOpenNutritionHit(entry: OpenNutritionFoodEntry): FoodSearchHit {
  return {
    source: 'opennutrition',
    sourceLabel: FOOD_LIBRARY_SOURCE_LABELS.opennutrition,
    id: entry.id,
    displayName: entry.brand ? `${entry.name} — ${entry.brand}` : entry.name,
    subtitle: entry.brand,
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    fatG: entry.fatG,
    carbsG: entry.carbsG,
    fiberG: entry.fiberG,
    barcode: entry.barcode,
    openNutritionEntry: entry,
  };
}

export class FoodSearchIndex {
  private ciqualEntries: IndexedCiqualEntry[] = [];
  private openNutritionEntries: IndexedOpenNutritionEntry[] = [];
  private readonly barcodeIndex = new Map<string, OpenNutritionFoodEntry>();

  get isReady(): boolean {
    return this.ciqualEntries.length > 0 || this.openNutritionEntries.length > 0;
  }

  get entryCount(): number {
    return this.ciqualEntries.length + this.openNutritionEntries.length;
  }

  load(ciqualChunk: CiqualFoodLibraryChunk, openNutritionChunk: OpenNutritionFoodLibraryChunk): void {
    this.ciqualEntries = ciqualChunk.entries.map((entry) => ({
      entry,
      searchText: buildCiqualSearchText(entry),
    }));

    this.openNutritionEntries = openNutritionChunk.entries.map((entry) => ({
      entry,
      searchText: buildOpenNutritionSearchText(entry),
    }));

    this.barcodeIndex.clear();
    for (const entry of openNutritionChunk.entries) {
      if (!entry.barcode) {
        continue;
      }

      const normalized = normalizeBarcodeInput(entry.barcode);
      this.barcodeIndex.set(normalized, entry);
      if (normalized.length < 13) {
        this.barcodeIndex.set(normalized.padStart(13, '0'), entry);
      }
    }
  }

  searchLocal(query: string, limitPerSection = DEFAULT_LIMIT_PER_SECTION): FoodSearchSection[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const sections: FoodSearchSection[] = [];

    const ciqualHits = this.ciqualEntries
      .filter((item) => matchesFoodSearchQuery(item.searchText, trimmed))
      .slice(0, limitPerSection)
      .map((item) => toCiqualHit(item.entry));

    if (ciqualHits.length > 0) {
      sections.push({
        source: 'ciqual',
        sourceLabel: FOOD_LIBRARY_SOURCE_LABELS.ciqual,
        hits: ciqualHits,
      });
    }

    let openNutritionHits = this.openNutritionEntries
      .filter((item) => matchesFoodSearchQuery(item.searchText, trimmed))
      .slice(0, limitPerSection)
      .map((item) => toOpenNutritionHit(item.entry));

    const normalizedBarcode = normalizeBarcodeInput(trimmed);
    if (isValidEan(normalizedBarcode)) {
      const barcodeEntry = this.lookupBarcodeEntry(normalizedBarcode);
      if (barcodeEntry) {
        const barcodeHit = toOpenNutritionHit(barcodeEntry);
        openNutritionHits = [
          barcodeHit,
          ...openNutritionHits.filter((hit) => hit.id !== barcodeHit.id),
        ].slice(0, limitPerSection);
      }
    }

    if (openNutritionHits.length > 0) {
      sections.push({
        source: 'opennutrition',
        sourceLabel: FOOD_LIBRARY_SOURCE_LABELS.opennutrition,
        hits: openNutritionHits,
      });
    }

    return sections;
  }

  searchByBarcode(barcode: string): FoodSearchHit | null {
    const entry = this.lookupBarcodeEntry(normalizeBarcodeInput(barcode));
    return entry ? toOpenNutritionHit(entry) : null;
  }

  private lookupBarcodeEntry(barcode: string): OpenNutritionFoodEntry | undefined {
    if (!barcode) {
      return undefined;
    }

    return (
      this.barcodeIndex.get(barcode) ??
      this.barcodeIndex.get(barcode.padStart(13, '0')) ??
      this.barcodeIndex.get(barcode.replace(/^0+/, ''))
    );
  }
}
