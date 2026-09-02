import type {
  OpenNutritionFoodEntry,
  OpenNutritionFoodLibraryChunk,
  OpenNutritionFoodType,
} from '../../src/app/core/food-library/opennutrition-library.types';
import { parseJsonField, parseTsvLine, type OpenNutritionTsvRow } from './opennutrition-tsv';

export const OPENNUTRITION_TARGET_ENTRIES = 10_000;
export const OPENNUTRITION_MIN_ENTRIES = 5_000;
export const OPENNUTRITION_MAX_ENTRIES = 15_000;

interface Nutrition100g {
  calories?: number;
  protein?: number;
  total_fat?: number;
  carbohydrates?: number;
  dietary_fiber?: number;
}

interface SourceRef {
  database?: string;
}

export interface BuildOpenNutritionLibraryOptions {
  libraryVersion: string;
  generatedAt?: string;
  targetEntries?: number;
}

interface ScoredCandidate extends OpenNutritionFoodEntry {
  score: number;
}

const FRENCH_NAME_PATTERN =
  /[àâäéèêëïîôùûüçœæ]/i;
const FRENCH_FOOD_WORDS =
  /\b(fromage|yaourt|lait|pain|beurre|crème|skyr|danone|nestlé|carrefour|intermarché|biscuit|jambon|saucisse|chocolat|compote|confiture)\b/i;
const EU_SOURCE_PATTERN =
  /\b(frida|open food facts|ausnut|canadian nutrient file|eurofir)\b/i;

const EU_BARCODE_PREFIXES = new Set([
  '300', '301', '302', '303', '304', '305', '306', '307', '308', '309',
  '310', '311', '312', '313', '314', '315', '316', '317', '318', '319',
  '320', '321', '322', '323', '324', '325', '326', '327', '328', '329',
  '330', '331', '332', '333', '334', '335', '336', '337', '338', '339',
  '340', '341', '342', '343', '344', '345', '346', '347', '348', '349',
  '350', '351', '352', '353', '354', '355', '356', '357', '358', '359',
  '360', '361', '362', '363', '364', '365', '366', '367', '368', '369',
  '370', '371', '372', '373', '374', '375', '376', '377', '378', '379',
  '380', '383', '385', '387', '400', '401', '402', '403', '404', '405',
  '406', '407', '408', '409', '410', '411', '412', '413', '414', '415',
  '416', '417', '418', '419', '420', '421', '422', '423', '424', '425',
  '426', '427', '428', '429', '430', '431', '432', '433', '434', '435',
  '436', '437', '438', '439', '440', '500', '501', '502', '503', '504',
  '505', '506', '507', '508', '509', '520', '521', '528', '529', '530',
  '531', '535', '539', '540', '541', '542', '543', '544', '545', '546',
  '547', '548', '549', '560', '569', '570', '571', '572', '573', '574',
  '575', '576', '577', '578', '579', '590', '594', '599', '640', '641',
  '642', '643', '644', '645', '646', '647', '648', '649', '690', '691',
  '692', '693', '694', '695', '696', '697', '698', '699', '700', '701',
  '702', '703', '704', '705', '706', '707', '708', '709', '729', '730',
  '731', '732', '733', '734', '735', '736', '737', '738', '739', '760',
  '761', '762', '763', '764', '765', '766', '767', '768', '769', '800',
  '801', '802', '803', '804', '805', '806', '807', '808', '809', '810',
  '811', '812', '813', '814', '815', '816', '817', '818', '819', '820',
  '821', '822', '823', '824', '825', '826', '827', '828', '829', '830',
  '831', '832', '833', '834', '835', '836', '837', '838', '839', '840',
  '841', '842', '843', '844', '845', '846', '847', '848', '849', '858',
  '859', '860', '865', '870', '871', '872', '873', '874', '875', '876',
  '877', '878', '879', '900', '901', '902', '903', '904', '905', '906',
  '907', '908', '909', '910', '911', '912', '913', '914', '915', '916',
  '917', '918', '919',
]);

export function hasFrenchIndicators(...texts: Array<string | undefined>): boolean {
  return texts.some((text) => {
    if (!text) {
      return false;
    }
    return FRENCH_NAME_PATTERN.test(text) || FRENCH_FOOD_WORDS.test(text);
  });
}

export function hasEuSource(sourceJson: string): boolean {
  return EU_SOURCE_PATTERN.test(sourceJson);
}

export function isEuBarcode(barcode: string | undefined): boolean {
  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return false;
  }

  const normalized = barcode.padStart(13, '0').slice(0, 3);
  return EU_BARCODE_PREFIXES.has(normalized);
}

export function extractBrandFromName(name: string): { name: string; brand?: string } {
  const match = name.match(/^(.+?)\s+by\s+(.+)$/i);
  if (!match) {
    return { name: name.trim() };
  }

  return {
    name: match[1].trim(),
    brand: match[2].trim(),
  };
}

function parseFoodType(raw: string): OpenNutritionFoodType | null {
  if (raw === 'everyday' || raw === 'grocery' || raw === 'prepared' || raw === 'restaurant') {
    return raw;
  }
  return null;
}

function hasCompleteMacros(nutrition: Nutrition100g): boolean {
  return [nutrition.calories, nutrition.protein, nutrition.total_fat, nutrition.carbohydrates].every(
    (value) => typeof value === 'number' && Number.isFinite(value),
  );
}

export function scoreOpenNutritionRow(row: OpenNutritionTsvRow): number {
  let score = 0;

  if (hasFrenchIndicators(row.name, row.alternate_names, row.description)) {
    score += 120;
  }
  if (hasEuSource(row.source)) {
    score += 90;
  }
  if (isEuBarcode(row.ean_13)) {
    score += 80;
  }
  if (row.type === 'grocery') {
    score += 40;
  }
  if (row.ean_13.trim()) {
    score += 25;
  }
  if (row.type === 'everyday') {
    score += 20;
  }
  if (row.type === 'prepared') {
    score += 10;
  }

  return score;
}

export function rowToCandidate(row: OpenNutritionTsvRow): ScoredCandidate | null {
  const foodType = parseFoodType(row.type);
  const nutrition = parseJsonField<Nutrition100g>(row.nutrition_100g);

  if (!foodType || !nutrition || !hasCompleteMacros(nutrition)) {
    return null;
  }

  const { name, brand } = extractBrandFromName(row.name);
  const barcode = row.ean_13.trim() || undefined;

  const entry: ScoredCandidate = {
    id: row.id,
    name,
    brand,
    barcode,
    type: foodType,
    kcal: Math.round(nutrition.calories!),
    proteinG: roundMacro(nutrition.protein!),
    fatG: roundMacro(nutrition.total_fat!),
    carbsG: roundMacro(nutrition.carbohydrates!),
    fiberG: roundMacro(nutrition.dietary_fiber ?? 0),
    score: 0,
  };

  entry.score = scoreOpenNutritionRow(row);
  return entry;
}

function roundMacro(value: number): number {
  return Math.round(value * 100) / 100;
}

export function selectOpenNutritionEntries(
  candidates: ScoredCandidate[],
  targetEntries: number,
): OpenNutritionFoodEntry[] {
  const byBarcode = new Map<string, ScoredCandidate>();
  const withoutBarcode: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.barcode) {
      const existing = byBarcode.get(candidate.barcode);
      if (!existing || candidate.score > existing.score) {
        byBarcode.set(candidate.barcode, candidate);
      }
      continue;
    }
    withoutBarcode.push(candidate);
  }

  const deduped = [...byBarcode.values(), ...withoutBarcode];
  deduped.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.name.localeCompare(right.name, 'fr');
  });

  return deduped.slice(0, targetEntries).map(({ score: _score, ...entry }) => entry);
}

export function buildOpenNutritionLibraryFromLines(
  lines: string[],
  options: BuildOpenNutritionLibraryOptions,
): OpenNutritionFoodLibraryChunk {
  const targetEntries = options.targetEntries ?? OPENNUTRITION_TARGET_ENTRIES;
  const candidates: ScoredCandidate[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const row = parseTsvLine(line);
    if (!row) {
      continue;
    }

    const candidate = rowToCandidate(row);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  const entries = selectOpenNutritionEntries(candidates, targetEntries);
  entries.sort((left, right) => left.name.localeCompare(right.name, 'fr'));

  return {
    libraryVersion: options.libraryVersion,
    source: 'opennutrition',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };
}

export function extractLibraryVersionFromArchiveName(filename: string): string | undefined {
  const match = filename.match(/opennutrition-dataset-([0-9.]+)\.zip/i);
  return match?.[1];
}
