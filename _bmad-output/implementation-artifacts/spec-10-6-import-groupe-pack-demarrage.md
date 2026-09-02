---
title: 'Story 10.6 — Import groupé pack démarrage'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '464e5c0'
story_key: '10-6-import-groupe-pack-demarrage'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** New users must import base ingredients one by one from the offline library.

**Approach:** One-tap curated Ciqual starter pack (~50 items) on the library screen; skip existing products; show summary.

## Boundaries & Constraints

**Always:**
- Curated list of Ciqual IDs verified against `ciqual-v2025.json`.
- Idempotent: existing products ignored (dedup via 10.4).
- Summary: « X ajoutés, Y déjà présents ».
- UI on `/products/library`.

**Never:**
- Online providers.
- Force-create duplicates in bulk.

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] `food-library-starter-pack.ts` curated IDs.
- [x] `FoodSearchIndex.getCiqualHitById` + `importStarterPack`.
- [x] Library page UI + summary.
- [x] Unit tests.

## Verification

- `npm test` — all pass.
