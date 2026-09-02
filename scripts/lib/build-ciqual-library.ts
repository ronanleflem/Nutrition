import type { CiqualFoodEntry, CiqualFoodLibraryChunk } from '../../src/app/core/food-library/ciqual-library.types';
import {
  extractTagValue,
  hasMissingAttribute,
  normalizeCode,
  parseBlocks,
  parseNumericValue,
} from './ciqual-xml';

/** Ciqual constituent codes (const_*.xml). */
export const CIQUAL_CONST_CODES = {
  kcal: '328',
  proteinG: '25000',
  fatG: '40000',
  carbsG: '31000',
  fiberG: '34100',
} as const;

export type CiqualConstField = keyof typeof CIQUAL_CONST_CODES;

export interface CiqualSourceFiles {
  alimXml: string;
  alimGrpXml: string;
  compoXml: string;
}

export interface BuildCiqualLibraryOptions {
  libraryVersion: string;
  generatedAt?: string;
}

function buildCategoryLookup(alimGrpXml: string): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const block of parseBlocks(alimGrpXml, 'ALIM_GRP')) {
    const grpCode = normalizeCode(extractTagValue(block, 'alim_grp_code'));
    const ssgrpCode = normalizeCode(extractTagValue(block, 'alim_ssgrp_code'));
    const ssssgrpCode = normalizeCode(extractTagValue(block, 'alim_ssssgrp_code'));
    const grpName = extractTagValue(block, 'alim_grp_nom_fr');
    const ssgrpName = extractTagValue(block, 'alim_ssgrp_nom_fr');
    const ssssgrpName = extractTagValue(block, 'alim_ssssgrp_nom_fr');

    if (!grpCode || !ssgrpCode || !ssssgrpCode) {
      continue;
    }

    const key = `${grpCode}|${ssgrpCode}|${ssssgrpCode}`;
    const category =
      ssssgrpName && ssssgrpName !== '-'
        ? ssssgrpName
        : ssgrpName && ssgrpName !== '-'
          ? ssgrpName
          : grpName ?? 'Non classé';

    lookup.set(key, category);
  }

  return lookup;
}

function resolveCategory(
  lookup: Map<string, string>,
  grpCode: string | undefined,
  ssgrpCode: string | undefined,
  ssssgrpCode: string | undefined,
): string {
  if (!grpCode || !ssgrpCode || !ssssgrpCode) {
    return 'Non classé';
  }

  return lookup.get(`${grpCode}|${ssgrpCode}|${ssssgrpCode}`) ?? 'Non classé';
}

function buildAliases(nameFr: string, nameEng?: string, nameSci?: string): string[] {
  const aliases = new Set<string>();

  if (nameEng && nameEng !== nameFr) {
    aliases.add(nameEng);
  }

  if (nameSci && nameSci !== '-' && nameSci !== nameFr) {
    aliases.add(nameSci);
  }

  return [...aliases];
}

function buildNutritionLookup(compoXml: string): Map<string, Partial<Record<CiqualConstField, number>>> {
  const lookup = new Map<string, Partial<Record<CiqualConstField, number>>>();
  const codeByField = new Map(
    (Object.entries(CIQUAL_CONST_CODES) as [CiqualConstField, string][]).map(([field, code]) => [
      code,
      field,
    ]),
  );

  for (const block of parseBlocks(compoXml, 'COMPO')) {
    const alimCode = normalizeCode(extractTagValue(block, 'alim_code'));
    const constCode = normalizeCode(extractTagValue(block, 'const_code'));

    if (!alimCode || !constCode) {
      continue;
    }

    const field = codeByField.get(constCode);
    if (!field) {
      continue;
    }

    if (hasMissingAttribute(block, 'teneur')) {
      continue;
    }

    const value = parseNumericValue(extractTagValue(block, 'teneur'));
    if (value === undefined) {
      continue;
    }

    const nutrition = lookup.get(alimCode) ?? {};
    nutrition[field] = value;
    lookup.set(alimCode, nutrition);
  }

  return lookup;
}

export function buildCiqualLibrary(
  sources: CiqualSourceFiles,
  options: BuildCiqualLibraryOptions,
): CiqualFoodLibraryChunk {
  const categoryLookup = buildCategoryLookup(sources.alimGrpXml);
  const nutritionLookup = buildNutritionLookup(sources.compoXml);
  const entries: CiqualFoodEntry[] = [];

  for (const block of parseBlocks(sources.alimXml, 'ALIM')) {
    const alimCode = normalizeCode(extractTagValue(block, 'alim_code'));
    const nameFr = extractTagValue(block, 'alim_nom_fr');

    if (!alimCode || !nameFr) {
      continue;
    }

    const nutrition = nutritionLookup.get(alimCode);
    const kcal = nutrition?.kcal;
    if (kcal === undefined) {
      continue;
    }

    const nameEng = extractTagValue(block, 'alim_nom_eng');
    const nameSci = hasMissingAttribute(block, 'alim_nom_sci')
      ? undefined
      : extractTagValue(block, 'alim_nom_sci');

    entries.push({
      id: `ciqual-${alimCode}`,
      nameFr,
      category: resolveCategory(
        categoryLookup,
        normalizeCode(extractTagValue(block, 'alim_grp_code')),
        normalizeCode(extractTagValue(block, 'alim_ssgrp_code')),
        normalizeCode(extractTagValue(block, 'alim_ssssgrp_code')),
      ),
      kcal,
      proteinG: nutrition?.proteinG ?? 0,
      fatG: nutrition?.fatG ?? 0,
      carbsG: nutrition?.carbsG ?? 0,
      fiberG: nutrition?.fiberG ?? 0,
      aliases: buildAliases(nameFr, nameEng, nameSci),
    });
  }

  entries.sort((left, right) => left.nameFr.localeCompare(right.nameFr, 'fr'));

  return {
    libraryVersion: options.libraryVersion,
    source: 'ciqual',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };
}

export function extractLibraryVersionFromFilename(filename: string): string | undefined {
  const match = filename.match(/(?:alim|compo|const|alim_grp)_(\d{4})_/i);
  return match?.[1];
}
