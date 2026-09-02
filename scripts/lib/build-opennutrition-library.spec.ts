import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildOpenNutritionLibraryFromLines,
  extractBrandFromName,
  extractLibraryVersionFromArchiveName,
  hasFrenchIndicators,
  isEuBarcode,
  rowToCandidate,
  scoreOpenNutritionRow,
  selectOpenNutritionEntries,
} from './build-opennutrition-library';
import { parseTsvLine } from './opennutrition-tsv';

const fixturesDir = join(import.meta.dirname, '../fixtures/opennutrition');

function loadFixtureLines(): string[] {
  const content = readFileSync(join(fixturesDir, 'opennutrition_foods.tsv'), 'utf8');
  return content.trim().split('\n').slice(1);
}

describe('build-opennutrition-library', () => {
  it('extracts brand from grocery names', () => {
    expect(extractBrandFromName('Skyr Nature by Danone')).toEqual({
      name: 'Skyr Nature',
      brand: 'Danone',
    });
  });

  it('detects French indicators and EU barcodes', () => {
    expect(hasFrenchIndicators('Œufs bio')).toBe(true);
    expect(isEuBarcode('3560070467394')).toBe(true);
    expect(isEuBarcode('0013764027053')).toBe(false);
  });

  it('scores French grocery higher than generic US items', () => {
    const french = parseTsvLine(loadFixtureLines()[0])!;
    const us = parseTsvLine(loadFixtureLines()[1])!;
    expect(scoreOpenNutritionRow(french)).toBeGreaterThan(scoreOpenNutritionRow(us));
  });

  it('excludes rows without complete macros or valid type', () => {
    const incomplete = parseTsvLine(loadFixtureLines()[2])!;
    expect(rowToCandidate(incomplete)).toBeNull();
  });

  it('deduplicates by barcode keeping highest score', () => {
    const candidates = loadFixtureLines()
      .map((line) => parseTsvLine(line))
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .map((row) => rowToCandidate(row))
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const selected = selectOpenNutritionEntries(candidates, 10);
    const duplicate = selected.find((entry) => entry.barcode === '1234567890123');
    expect(duplicate?.name).toBe('Duplicate Barcode B');
  });

  it('builds library chunk with manifest fields', () => {
    const chunk = buildOpenNutritionLibraryFromLines(loadFixtureLines(), {
      libraryVersion: '2025.1',
      generatedAt: '2026-09-02T00:00:00.000Z',
      targetEntries: 10,
    });

    expect(chunk.source).toBe('opennutrition');
    expect(chunk.libraryVersion).toBe('2025.1');
    expect(chunk.entryCount).toBeGreaterThan(0);

    const skyr = chunk.entries.find((entry) => entry.brand === 'Danone');
    expect(skyr).toMatchObject({
      name: 'Skyr Nature',
      barcode: '3560070467394',
      kcal: 63,
      proteinG: 10.5,
    });
  });

  it('extracts library version from archive filename', () => {
    expect(extractLibraryVersionFromArchiveName('opennutrition-dataset-2025.1.zip')).toBe(
      '2025.1',
    );
  });
});
