---
title: 'Story 10.4 — Importer vers mon catalogue'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'ca26f32'
story_key: '10-4-importer-vers-mon-catalogue'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can search the offline library but cannot add hits to their personal catalogue.

**Approach:** Add `FoodLibraryImportService` to create `Product` + `ProductReference` from library hits, with deduplication and a catalogue import UI.

## Boundaries & Constraints

**Always:**
- Ciqual → ref label « Générique », no barcode; OpenNutrition with barcode → ref with barcode.
- Optional `sourceProvider` + `sourceId` on `Product`.
- Dedup by source id, barcode, or normalized name (+ brand); propose merge dialog.
- UI: `/products/library` with « Ajouter à mon catalogue ».

**Never:**
- Recipe picker integration (10.5).
- Online providers.

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] Extend `Product` with `sourceProvider` / `sourceId`.
- [x] `food-library-import.ts` mapping + dedup.
- [x] `FoodLibraryImportService`.
- [x] `food-library-page` UI + route.
- [x] Unit/integration tests.

## Verification

- `npm test` — all pass.
