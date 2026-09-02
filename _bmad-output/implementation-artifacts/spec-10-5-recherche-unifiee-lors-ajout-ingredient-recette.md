---
title: 'Story 10.5 — Recherche unifiée lors ajout ingrédient recette'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '8fbe4cb'
story_key: '10-5-recherche-unifiee-lors-ajout-ingredient-recette'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-10-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recipe ingredient forms only offer a static catalogue dropdown; users cannot search Ciqual/OpenNutrition offline when adding ingredients.

**Approach:** Unified ingredient picker sheet with sections Mon catalogue → Ciqual → OpenNutrition; auto-import library hits (10.4) then select product; quantity field remains in the form row.

## Boundaries & Constraints

**Always:**
- Cascade order: Mon catalogue → Ciqual → OpenNutrition (FR-26).
- Library selection triggers auto-import then ingredient assignment.
- Quantity (grams) asked in the form after product selection.
- Works 100 % offline.

**Never:**
- Online providers (Epic 11).
- Starter pack import (10.6).

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] `ingredient-picker-search` + `FoodSearchService.searchForIngredientPicker`.
- [x] `IngredientProductPickerSheetComponent` (search, import, duplicate dialog).
- [x] Wire into `recipe-form-page` and `recipe-variant-form-page`.
- [x] Unit tests.

## Verification

- `npm test` — all pass.
