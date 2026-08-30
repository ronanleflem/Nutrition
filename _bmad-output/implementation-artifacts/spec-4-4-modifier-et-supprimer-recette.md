---
title: 'Story 4.4 — Modifier et supprimer recette'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '0bc4a3f46ebdcb9321e8db3b03b48363adea2373'
story_key: '4-4-modifier-et-supprimer-recette'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-3-calcul-macros-par-portion.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot edit recipe family metadata or delete recipes, blocking maintenance of their recipe book.

**Approach:** Add `updateRecipe` and `deleteRecipe` (cascade variants/ingredients/plan entries) in `DatabaseService`, introduce `mealPlanEntries` Dexie table, and wire edit form + delete confirmation on the recipe detail page.

## Boundaries & Constraints

**Always:**
- Edit persists recipe family fields: title, steps, durationMin, defaultPortions, tags, notes (FR-14).
- Delete removes recipe, all variants, all ingredients, and associated `mealPlanEntries` (FR-14).
- If recipe is referenced in plan, confirmation dialog explains plan entries will be removed.
- Reuse `ConfirmDialogComponent`; French UI.

**Ask First:**
- Edit variant ingredients inline (post-MVP polish).
- Meal plan UI (Epic 6).

**Never:**
- Soft-delete recipes.
- Leave orphan plan entries after delete.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Update metadata | Valid title, ≥1 step, portions > 0 | Recipe row updated, updatedAt refreshed | Validation errors |
| Delete recipe | No plan entries | Recipe + variants + ingredients removed | N/A |
| Delete with plan refs | mealPlanEntries exist | Confirm dialog; on confirm, recipe + plan entries removed | N/A |
| Invalid recipe id | Unknown id on update/delete | Error thrown | French message |
| Empty steps | All blank steps on edit | Save blocked | Inline validation |

</frozen-after-approval>

## Code Map

- `src/app/core/models/meal-plan-entry.ts` — MealPlanEntry model.
- `src/app/core/database/nutrition-database.ts` — Dexie v6 + `mealPlanEntries` store.
- `src/app/core/database/database.service.ts` — `updateRecipe`, `deleteRecipe`, `countMealPlanEntriesForRecipe`.
- `src/app/core/database/database.service.recipes.spec.ts` — edit/delete matrix tests.
- `src/app/features/recipes/components/recipe-edit-page/` — metadata edit form.
- `src/app/features/recipes/components/recipe-detail-page/` — edit link + delete with confirm.
- `src/app/features/recipes/recipes.routes.ts` — `/:id/edit` route.
- `src/app/features/recipes/services/recipes.service.ts` — service methods.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/core/models/meal-plan-entry.ts` — model.
- [ ] `src/app/core/database/nutrition-database.ts` — v6 schema.
- [ ] `src/app/core/database/database.service.ts` — update + delete APIs.
- [ ] `src/app/core/database/database.service.recipes.spec.ts` — tests.
- [ ] `src/app/features/recipes/components/recipe-edit-page/` — edit UI.
- [ ] `src/app/features/recipes/components/recipe-detail-page/` — delete confirm + edit CTA.
- [ ] `src/app/features/recipes/recipes.routes.ts` — edit route.
- [ ] `src/app/features/recipes/services/recipes.service.ts` — wrappers.

**Acceptance Criteria:**
- Given an existing recipe, when I edit title/steps/portions/tags/notes, then changes persist in IndexedDB.
- Given a recipe referenced in meal plan, when I delete it and confirm, then recipe and plan entries are removed.
- Given a recipe not in plan, when I delete without plan refs, then simple confirmation still works.

## Verification

**Commands:**
- `npm test -- --no-watch` — all tests pass.
- `npm run build` — succeeds.
