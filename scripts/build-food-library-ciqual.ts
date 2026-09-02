#!/usr/bin/env node
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCiqualLibrary,
  extractLibraryVersionFromFilename,
} from './lib/build-ciqual-library';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const sourceDir = resolve(projectRoot, 'data/ciqual');
const outputDir = resolve(projectRoot, 'src/assets/food-library');

const REQUIRED_PREFIXES = ['alim_', 'alim_grp_', 'compo_'] as const;

function findSourceFile(prefix: string): string {
  const matches = readdirSync(sourceDir).filter((name) => {
    if (!name.endsWith('.xml')) {
      return false;
    }
    if (prefix === 'alim_') {
      return name.startsWith('alim_') && !name.startsWith('alim_grp_');
    }
    return name.startsWith(prefix);
  });

  if (matches.length === 0) {
    throw new Error(
      `Fichier source manquant dans ${sourceDir}: attendu ${prefix}*.xml (télécharger depuis Zenodo doi:10.5281/zenodo.17550133)`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Plusieurs fichiers ${prefix}*.xml dans ${sourceDir}: ${matches.join(', ')}`,
    );
  }

  return matches[0];
}

function main(): void {
  const alimFile = findSourceFile('alim_');
  const alimGrpFile = findSourceFile('alim_grp_');
  const compoFile = findSourceFile('compo_');
  const libraryVersion = extractLibraryVersionFromFilename(alimFile);

  if (!libraryVersion) {
    throw new Error(`Impossible d'extraire l'année depuis le fichier ${alimFile}`);
  }

  const chunk = buildCiqualLibrary(
    {
      alimXml: readFileSync(join(sourceDir, alimFile), 'utf8'),
      alimGrpXml: readFileSync(join(sourceDir, alimGrpFile), 'utf8'),
      compoXml: readFileSync(join(sourceDir, compoFile), 'utf8'),
    },
    { libraryVersion },
  );

  if (chunk.entryCount < 3000) {
    throw new Error(
      `Seulement ${chunk.entryCount} entrées produites — minimum attendu : 3000`,
    );
  }

  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, `ciqual-v${libraryVersion}.json`);
  const json = JSON.stringify(chunk);
  writeFileSync(outputFile, json, 'utf8');

  const gzipBytes = gzipSync(json).byteLength;
  const gzipLimitBytes = 1.5 * 1024 * 1024;

  console.log(`✓ ${outputFile}`);
  console.log(`  entrées : ${chunk.entryCount}`);
  console.log(`  taille JSON : ${(json.length / 1024 / 1024).toFixed(2)} Mo`);
  console.log(`  taille gzip : ${(gzipBytes / 1024 / 1024).toFixed(2)} Mo`);

  if (gzipBytes >= gzipLimitBytes) {
    throw new Error(
      `Chunk gzip ${(gzipBytes / 1024 / 1024).toFixed(2)} Mo dépasse la limite 1,5 Mo (NFR-13)`,
    );
  }
}

try {
  for (const prefix of REQUIRED_PREFIXES) {
    findSourceFile(prefix);
  }
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`build-food-library-ciqual: ${message}`);
  process.exit(1);
}
