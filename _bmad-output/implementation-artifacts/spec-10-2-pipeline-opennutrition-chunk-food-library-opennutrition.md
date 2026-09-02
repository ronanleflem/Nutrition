---
title: 'Story 10.2 — Pipeline OpenNutrition → chunk food-library-opennutrition'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '813db2943512abf5e805cf77863096ca56672df1'
story_key: '10-2-pipeline-opennutrition-chunk-food-library-opennutrition'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/DATA-SOURCES.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Offline search lacks branded products and barcode lookup; Ciqual alone covers only generic French foods.

**Approach:** Add a build-time pipeline that filters the OpenNutrition TSV into a curated FR/EU-prioritized JSON chunk with brand, optional barcode, and macros per 100g.

## Boundaries & Constraints

**Always:**
- Script: `scripts/build-food-library-opennutrition.ts`.
- Output: `src/assets/food-library/opennutrition-v{version}.json`.
- Entry fields: `id`, `name`, `brand?`, `barcode?`, `type`, `kcal`, `proteinG`, `fatG`, `carbsG`, `fiberG`.
- Filter: complete macros (kcal, protein, fat, carbs).
- Subset: 5 000–15 000 entries; gzip < 2 Mo (NFR-13).
- Priority scoring: French name, EU source DB, EU barcode, grocery+barcode.
- Source TSV in `data/opennutrition/` (gitignored); commit generated JSON.
- ODbL attribution documented in `DATA-SOURCES.md`.

**Ask First:** None.

**Never:**
- Runtime API to OpenNutrition.
- Embed full 326k dataset.
- Angular UI (Stories 10.3+).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full build | TSV present | JSON 5k–15k entries, gzip < 2 Mo | Exit 1 if missing source |
| Incomplete macros | Missing fat or carbs | Row excluded | N/A |
| Brand extraction | `Product by Brand` name | `name` + `brand` split | Plain name if no `by` |
| Barcode dedup | Same EAN twice | Keep highest-scored row | N/A |
| French priority | French name or EU source | Higher selection score | N/A |

</frozen-after-approval>

## Code Map

- `scripts/build-food-library-opennutrition.ts` — CLI with streaming TSV read.
- `scripts/lib/opennutrition-tsv.ts` — 13-column TSV parser.
- `scripts/lib/build-opennutrition-library.ts` — filter, score, dedupe, select top N.
- `src/app/core/food-library/opennutrition-library.types.ts` — shared types.
- `scripts/fixtures/opennutrition/` — test fixtures.
- `DATA-SOURCES.md` — ODbL attribution paragraph.

## Tasks & Acceptance

**Execution:**
- [x] `opennutrition-library.types.ts` — manifest + entry types.
- [x] `opennutrition-tsv.ts` + `build-opennutrition-library.ts` — parse, score, build.
- [x] `build-food-library-opennutrition.ts` — CLI.
- [x] Unit tests + fixtures.
- [x] `package.json` script + `.gitignore` for `data/opennutrition/`.
- [x] `DATA-SOURCES.md` ODbL attribution.
- [x] Run build → `opennutrition-v2025.1.json`.

**Acceptance Criteria:**
- Given OpenNutrition TSV, when `npm run build:food-library:opennutrition`, then JSON with 5k–15k entries and manifest `source: "opennutrition"`.
- Given output entries, then complete macros and optional `brand`/`barcode`.
- Given output file, then gzip < 2 Mo.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build:food-library:opennutrition` — succeeds.
- `npm run build` — succeeds.

## Spec Change Log

## Design Notes

- No `country` column in upstream TSV; FR/EU priority via French text, EU GS1 prefixes, and EU source DB names (Frida, AUSNUT, etc.).
- Auto-reduces target count if gzip exceeds 2 Mo before failing.
