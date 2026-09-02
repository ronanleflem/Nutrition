---
title: 'Story 10.1 — Pipeline Ciqual → chunk food-library-ciqual'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'e85d191ea770ec44777d0a064feb448c290517e8'
story_key: '10-1-pipeline-ciqual-chunk-food-library-ciqual'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/DATA-SOURCES.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has no offline generic French food data; users cannot find official ingredients like « œuf » without network or manual entry.

**Approach:** Add a build-time TypeScript pipeline that parses Ciqual ANSES XML exports into a versioned JSON chunk under `src/assets/food-library/`, with shared types for downstream `FoodSearchService` stories.

## Boundaries & Constraints

**Always:**
- Script path: `scripts/build-food-library-ciqual.ts`.
- Output: `src/assets/food-library/ciqual-v{year}.json` with manifest `libraryVersion`, `source: 'ciqual'`, and `entries[]`.
- Entry fields: `id`, `nameFr`, `category`, `kcal`, `proteinG`, `fatG`, `carbsG`, `fiberG` (per 100 g), `aliases[]`.
- ≥ 3 000 entries from real Ciqual 2025 data; gzip output < 1.5 Mo (NFR-13).
- Source XML in `data/ciqual/` (gitignored); commit generated JSON.
- Ciqual constituent codes: kcal=328, protein=25000, fat=40000, carbs=31000, fiber=34100.
- Register `src/assets` in `angular.json`.
- npm script `build:food-library:ciqual` to regenerate.

**Ask First:** None.

**Never:**
- Runtime API calls to Ciqual or third parties.
- Backend or cloud storage for library data.
- Angular UI changes (Stories 10.3–10.6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full build | All 4 XML files present in `data/ciqual/` | JSON with ≥3000 entries, manifest correct | Exit 1 + French error if files missing |
| Missing source | `data/ciqual/` empty | Script fails before write | Clear message listing required files |
| Decimal values | `teneur` uses comma (e.g. `59,7`) | Parsed as 59.7 | N/A |
| Missing macro | One constituent absent for food | Field defaults to 0 | Entry still included if kcal present |
| Missing kcal | No energy value for food | Entry excluded | N/A |
| Aliases | English name differs from French | Included in `aliases[]` | Scientific name added when present |

</frozen-after-approval>

## Code Map

- `angular.json` — add `src/assets` to build assets (currently only `public/`).
- `package.json` — add `build:food-library:ciqual` script; `tsx` devDependency for script runner.
- `.gitignore` — ignore `data/ciqual/` source downloads (67 MB compo file).
- `src/app/core/food-library/ciqual-library.types.ts` — shared manifest + entry types.
- `scripts/lib/ciqual-xml.ts` — lightweight XML block parser (no new XML lib).
- `scripts/lib/build-ciqual-library.ts` — pure build logic (testable).
- `scripts/build-food-library-ciqual.ts` — CLI: read `data/ciqual/`, write `src/assets/food-library/ciqual-v{year}.json`.
- `scripts/lib/build-ciqual-library.spec.ts` — unit tests with minimal fixtures.
- `scripts/fixtures/ciqual/` — tiny XML samples for tests.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/food-library/ciqual-library.types.ts` — manifest and entry interfaces.
- [x] `scripts/lib/ciqual-xml.ts` — tag extraction and COMPO/ALIM block parsing.
- [x] `scripts/lib/build-ciqual-library.ts` — join alim + groups + compo into library JSON.
- [x] `scripts/build-food-library-ciqual.ts` — CLI entry with path defaults and gzip size report.
- [x] `scripts/lib/build-ciqual-library.spec.ts` — matrix edge cases (comma decimal, missing macro, aliases).
- [x] `scripts/fixtures/ciqual/` — minimal XML fixtures for tests.
- [x] `angular.json` — register `src/assets` folder.
- [x] `package.json` — `build:food-library:ciqual` + `tsx` dependency.
- [x] `.gitignore` — `data/ciqual/`.
- [x] Run build script → commit `src/assets/food-library/ciqual-v2025.json`.

**Acceptance Criteria:**
- Given Ciqual XML in `data/ciqual/`, when `npm run build:food-library:ciqual`, then `src/assets/food-library/ciqual-v2025.json` is produced with ≥3000 entries.
- Given the output file, then manifest has `libraryVersion: "2025"`, `source: "ciqual"`, and each entry has required macro fields and `aliases[]`.
- Given the output file, then gzip size is < 1.5 Mo.

## Verification

**Commands:**
- `npm test` — all pass including new ciqual build tests.
- `npm run build:food-library:ciqual` — succeeds, prints entry count and gzip size.
- `npm run build` — succeeds with assets included.

## Spec Change Log

## Design Notes

- Category uses French subgroup name from `alim_grp` join; falls back to group name.
- Entry `id` format: `ciqual-{alim_code}` (zero-padded code in source, trimmed in output).
- `libraryVersion` derived from XML filename year segment (e.g. `2025` from `alim_2025_11_03.xml`).
