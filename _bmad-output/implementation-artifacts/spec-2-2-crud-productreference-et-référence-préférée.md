---
title: 'Story 2.2 — CRUD ProductReference et référence préférée'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'ae5b74e3d7757d4a8511ca700d09c881c5a3fd1f'
story_key: '2-2-crud-productreference-et-référence-préférée'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-crud-product-générique.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Products exist without store-specific references, macros, or nutritional scores; users cannot compare brands or designate canonical macros.

**Approach:** Add `productReferences` Dexie table, `NutritionalScoreService`, reference CRUD on product detail, preferred-reference selection, and ordered `recommendedStores` derived from reference scores.

## Boundaries & Constraints

**Always:**
- `NutritionalScoreService` is the single score formula source (AR-6).
- Dexie v3 adds `productReferences` with indexes `productId`, `barcode`, `nutritionalScore`, `store`.
- Reference form: store, label, macros/100g required; barcode optional.
- `preferredReferenceId` settable per product; banner when unset (UX-DR15).
- Primary store display = preferred reference store (AR-7).
- `recommendedStores[]` default = stores from refs sorted score ↓ then store.

**Ask First:**
- Search/sort catalogue list UI (story 2.3).
- Scanner / OFF prefill (story 2.4).

**Never:**
- Barcode on Product entity (AR-9).
- Archive/restore flows (story 2.5).

</frozen-after-approval>

## Code Map

- `src/app/core/models/product-reference.ts` — reference model, deriveRecommendedStores.
- `src/app/core/models/store.ts` — store enum + French labels.
- `src/app/core/models/product-catalog.ts` — catalog item + sort by preferred score.
- `src/app/core/scoring/nutritional-score.service.ts` — score calculation (AR-6).
- `src/app/core/database/nutrition-database.ts` — schema v3 productReferences.
- `src/app/core/database/database.service.ts` — reference CRUD, setPreferredReference, sync stores.
- `src/app/features/products/components/product-detail-page/` — refs list, banner, set preferred.
- `src/app/features/products/components/reference-row/` — ReferenceRow + badge Préférée.
- `src/app/features/products/components/reference-form-page/` — create/edit reference.
- `src/app/features/products/components/score-chip/` — neutral score display.

## Tasks & Acceptance

**Execution:**
- [x] Core models + NutritionalScoreService + Dexie v3.
- [x] DatabaseService reference API + recommendedStores sync.
- [x] Product detail page with reference list and preferred banner.
- [x] Reference form create/edit routes.
- [x] ProductCard enriched with store/score from preferred ref.
- [x] Unit tests for score, references, catalog sort.

**Acceptance Criteria:**
- Given an existing Product, when I create a ProductReference with store, label, macros/100g, then nutritionalScore is computed and persisted (AR-6).
- Given references, when I set preferredReferenceId, then it persists and primary store reflects preferred ref (AR-5, AR-7, UX-DR3).
- Given no preferred reference, when viewing product detail, then banner « Choisir une référence pour les macros » appears (UX-DR15).
- Given references saved, when product loads, then recommendedStores follows score-desc store order (AR-7).

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass.

### Review Findings

- [x] [Review][Patch] Bandeau macros basé sur résolution `preferredReference` — corrigé
- [x] [Review][Patch] Normalisation code-barres chiffres (DB + modèles) — corrigé
- [x] [Review][Patch] Validation EAN sur formulaire référence — corrigé
- [x] [Review][Patch] Détail / formulaire référence : réabonnement `paramMap` — corrigé
- [x] [Review][Patch] Erreurs DB avec feedback utilisateur — corrigé
- [x] [Review][Defer] Première référence non auto-désignée préférée — hors AC
- [x] [Review][Defer] Badge « Préférée » non testé en composant — dette tests
