---
title: 'Story 11.4 — Recherche unifiée — implémentation cascade'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'bb97e4d'
story_key: '11-4-recherche-unifiee-cascade'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Online providers (11.1–11.3) were wired only on the food library page; other product picker surfaces still stopped at catalogue + offline library.

**Approach:** Centralize cascade in `FoodSearchService.searchCascade()` and `runFoodSearchCascade()`; wire all picker surfaces with shared UX (debounce 400 ms, offline message, manual online button, per-section spinners, source badges).

## Boundaries & Constraints

**Always:**
- Cascade order: Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA (FR-26).
- Empty sections hidden.
- Offline: sections 4–6 absent + explicit offline message.
- Online: providers 4–6 in parallel after debounce (or manual trigger).
- `preferManualOnlineSearch` in `appSettings` + « Rechercher en ligne » button (NFR-19).

**Never:**
- IndexedDB search history cache (11.5).

## Surfaces

- Recette : `IngredientProductPickerSheetComponent`
- Garde-manger : `PantryAddSheetComponent` → picker unifié
- Catalogue : `ProductsPageComponent` recherche cascade
- Bibliothèque offline : `FoodLibraryPageComponent` (refactor cascade runner)
- Scan barcode : flow existant OpenNutrition offline → OFF (inchangé, conforme UX)

</frozen-after-approval>

## Code Map

- `src/app/core/food-library/food-search.service.ts` — `searchCascade()`
- `src/app/core/food-library/food-search-cascade*.ts` — merge + runner + messages
- `src/app/core/food-library/components/food-search-cascade-results/` — shared results UI
- `src/app/features/recipes/components/ingredient-product-picker-sheet/*` — full cascade
- `src/app/features/products/products-page.component.*` — catalogue search cascade
- `src/app/features/pantry/pantry-add-sheet.component.*` — unified product picker
- `src/app/features/settings/components/api-keys-page/*` — manual online preference

## Tasks & Acceptance

**Execution:**
- [x] `searchCascade()` + shared merge/runner/messages.
- [x] Ingredient picker: online sections, manual button, offline message, online hit flow.
- [x] Products page: unified cascade on search.
- [x] Pantry add: unified product picker sheet.
- [x] Food library page: cascade runner + manual online button.
- [x] `preferManualOnlineSearch` setting + api-keys UI.
- [x] Tests updated/added.

**Acceptance Criteria:**
- Given any product picker surface, when searching, then cascade order is respected.
- Given offline, when searching, then sections 4–6 absent with offline message.
- Given manual preference, when typing, then online providers wait for « Rechercher en ligne ».
- Given online auto mode, when debounce satisfied (≥ 3 chars), then providers 4–6 run in parallel.

## Verification

- `npm test` — all pass including cascade runner and picker/search specs.
