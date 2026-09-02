---
title: 'Story 10.3 — FoodSearchService index local unifié'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '665a5be8a2f1c0e8f0e8b0e6f3f0e8c8f0e8b0e6'
story_key: '10-3-foodsearchservice-index-local-unifie'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Offline library chunks exist but no unified search API; users cannot query Ciqual + OpenNutrition locally.

**Approach:** Add `FoodSearchService` with lazy chunk loading, in-memory indexes, grouped `searchLocal()` and `searchByBarcode()` for OpenNutrition.

## Boundaries & Constraints

**Always:**
- Lazy-load `assets/food-library/*.json` on first use (parallel fetch).
- `searchLocal()` returns sections ordered: Ciqual → OpenNutrition with `sourceLabel` badges.
- `searchByBarcode()` queries OpenNutrition index only (FR-36).
- Search < 100 ms after indexes built (NFR-14).
- 100 % offline — fetch local assets only, no third-party APIs.
- Register food-library assets in ngsw lazy group.

**Ask First:** None.

**Never:**
- UI picker integration (Stories 10.5+).
- Import to catalogue (Story 10.4).
- Online providers (Epic 11).

</frozen-after-approval>

## Code Map

- `food-search.service.ts` — lazy load + public API.
- `food-search-index.ts` — pure index build/search (testable).
- `food-search.types.ts` — `FoodSearchHit`, `FoodSearchSection`.
- `normalize-food-search.ts` — accent-insensitive token matching.
- `food-library-paths.ts` — chunk URLs.
- `ngsw-config.json` — lazy `food-library` asset group.

## Tasks & Acceptance

**Execution:**
- [x] Core types + normalize helpers.
- [x] `FoodSearchIndex` with grouped search + barcode lookup.
- [x] `FoodSearchService` with lazy loading signals.
- [x] Unit + performance tests.
- [x] ngsw lazy asset group.

**Acceptance Criteria:**
- Given chunks loaded lazily, when `searchLocal('skyr')`, then Ciqual section precedes OpenNutrition with source labels.
- Given valid barcode in OpenNutrition chunk, when `searchByBarcode()`, then hit returned offline.
- Given loaded index ≤ 10k entries, when `searchLocal()`, then duration < 100 ms.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build` — succeeds.

## Spec Change Log
