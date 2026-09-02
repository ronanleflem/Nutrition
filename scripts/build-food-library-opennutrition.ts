#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildOpenNutritionLibraryFromLines,
  extractLibraryVersionFromArchiveName,
  OPENNUTRITION_MAX_ENTRIES,
  OPENNUTRITION_MIN_ENTRIES,
  OPENNUTRITION_TARGET_ENTRIES,
} from './lib/build-opennutrition-library';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const sourceDir = resolve(projectRoot, 'data/opennutrition');
const outputDir = resolve(projectRoot, 'src/assets/food-library');

function findSourceTsv(): string {
  const matches = readdirSync(sourceDir).filter(
    (name) => name === 'opennutrition_foods.tsv' || name.endsWith('_foods.tsv'),
  );

  if (matches.length === 0) {
    throw new Error(
      `Fichier TSV manquant dans ${sourceDir}: télécharger opennutrition-dataset-*.zip depuis https://downloads.opennutrition.app/`,
    );
  }

  if (matches.length > 1) {
    throw new Error(`Plusieurs TSV dans ${sourceDir}: ${matches.join(', ')}`);
  }

  return matches[0];
}

function resolveLibraryVersion(tsvFile: string): string {
  const archives = readdirSync(sourceDir).filter((name) =>
    name.toLowerCase().endsWith('.zip'),
  );

  for (const archive of archives) {
    const version = extractLibraryVersionFromArchiveName(archive);
    if (version) {
      return version;
    }
  }

  const match = tsvFile.match(/([0-9]{4}(?:\.[0-9]+)?)/);
  return match?.[1] ?? 'unknown';
}

async function readTsvLines(tsvPath: string): Promise<string[]> {
  const lines: string[] = [];
  const stream = createInterface({
    input: createReadStream(tsvPath, 'utf8'),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  for await (const line of stream) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    lines.push(line);
  }

  return lines;
}

async function main(): Promise<void> {
  const tsvFile = findSourceTsv();
  const libraryVersion = resolveLibraryVersion(tsvFile);
  const lines = await readTsvLines(join(sourceDir, tsvFile));

  let targetEntries = OPENNUTRITION_TARGET_ENTRIES;
  let chunk = buildOpenNutritionLibraryFromLines(lines, { libraryVersion, targetEntries });

  while (chunk.entryCount > OPENNUTRITION_MIN_ENTRIES) {
    const json = JSON.stringify(chunk);
    const gzipBytes = gzipSync(json).byteLength;
    if (gzipBytes < 2 * 1024 * 1024) {
      break;
    }
    targetEntries = Math.floor(targetEntries * 0.85);
    chunk = buildOpenNutritionLibraryFromLines(lines, { libraryVersion, targetEntries });
  }

  if (chunk.entryCount < OPENNUTRITION_MIN_ENTRIES) {
    throw new Error(
      `Seulement ${chunk.entryCount} entrées produites — minimum attendu : ${OPENNUTRITION_MIN_ENTRIES}`,
    );
  }

  if (chunk.entryCount > OPENNUTRITION_MAX_ENTRIES) {
    throw new Error(
      `${chunk.entryCount} entrées dépasse le maximum ${OPENNUTRITION_MAX_ENTRIES}`,
    );
  }

  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, `opennutrition-v${libraryVersion}.json`);
  const json = JSON.stringify(chunk);
  writeFileSync(outputFile, json, 'utf8');

  const manifestPath = join(outputDir, 'manifest.json');
  let manifest: Record<string, string> = {};
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, string>;
  } catch {
    // manifest absent — créé ci-dessous
  }
  manifest.opennutrition = `opennutrition-v${libraryVersion}.json`;
  if (!manifest.ciqual) {
    manifest.ciqual = 'ciqual-v2025.json';
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const gzipBytes = gzipSync(json).byteLength;
  const gzipLimitBytes = 2 * 1024 * 1024;

  console.log(`✓ ${outputFile}`);
  console.log(`  entrées : ${chunk.entryCount}`);
  console.log(`  taille JSON : ${(json.length / 1024 / 1024).toFixed(2)} Mo`);
  console.log(`  taille gzip : ${(gzipBytes / 1024 / 1024).toFixed(2)} Mo`);

  if (gzipBytes >= gzipLimitBytes) {
    throw new Error(
      `Chunk gzip ${(gzipBytes / 1024 / 1024).toFixed(2)} Mo dépasse la limite 2 Mo (NFR-13)`,
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`build-food-library-opennutrition: ${message}`);
  process.exit(1);
});
