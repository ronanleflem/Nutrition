import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildCiqualLibrary,
  extractLibraryVersionFromFilename,
} from './build-ciqual-library';
import { parseNumericValue } from './ciqual-xml';

const fixturesDir = join(import.meta.dirname, '../fixtures/ciqual');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

describe('ciqual-xml', () => {
  it('parses comma decimal values', () => {
    expect(parseNumericValue('12,8')).toBe(12.8);
  });
});

describe('build-ciqual-library', () => {
  it('builds entries with aliases and category resolution', () => {
    const chunk = buildCiqualLibrary(
      {
        alimXml: loadFixture('alim_2025_01_01.xml'),
        alimGrpXml: loadFixture('alim_grp_2025_01_01.xml'),
        compoXml: loadFixture('compo_2025_01_01.xml'),
      },
      { libraryVersion: '2025', generatedAt: '2026-09-02T00:00:00.000Z' },
    );

    expect(chunk.source).toBe('ciqual');
    expect(chunk.libraryVersion).toBe('2025');
    expect(chunk.entryCount).toBe(2);

    const egg = chunk.entries.find((entry) => entry.id === 'ciqual-9001');
    expect(egg).toMatchObject({
      nameFr: 'Œuf, cru',
      category: 'œufs de poule',
      kcal: 143,
      proteinG: 12.8,
      fatG: 9.9,
      carbsG: 0,
      fiberG: 0,
      aliases: ['Egg, raw'],
    });

    const apple = chunk.entries.find((entry) => entry.id === 'ciqual-9002');
    expect(apple).toMatchObject({
      nameFr: 'Pomme, crue',
      category: 'fruits',
      kcal: 52,
      proteinG: 0,
      carbsG: 11.3,
      fiberG: 0,
      aliases: ['Apple, raw', 'Malus domestica'],
    });
  });

  it('excludes foods without kcal', () => {
    const chunk = buildCiqualLibrary(
      {
        alimXml: loadFixture('alim_2025_01_01.xml'),
        alimGrpXml: loadFixture('alim_grp_2025_01_01.xml'),
        compoXml: loadFixture('compo_2025_01_01.xml'),
      },
      { libraryVersion: '2025' },
    );

    expect(chunk.entries.some((entry) => entry.id === 'ciqual-9003')).toBe(false);
  });

  it('extracts library version from filenames', () => {
    expect(extractLibraryVersionFromFilename('alim_2025_11_03.xml')).toBe('2025');
  });
});
