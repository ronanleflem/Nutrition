---
title: 'Story 6.1 — Vue semaine et assignation recette'
type: 'feature'
created: '2026-08-31'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '73c6c91436779590a334444b2905a05add757b59'
story_key: '6-1-vue-semaine-et-assignation-recette'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-3-calcul-macros-par-portion.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/plan` is a placeholder; users cannot assign recipes to weekly meal slots, blocking meal planning, shopping list generation, and macro synthesis.

**Approach:** Add `WeekGrid` with 7-day selector and 3 slots per day, recipe picker bottom sheet with search and macro preview, and `DatabaseService` CRUD for `mealPlanEntries` with one recipe per date+slot.

## Boundaries & Constraints

**Always:**
- One `MealPlanEntry` per `date` + `slot`; reject duplicate on create.
- New entries store `recipeId` and omit `recipeVariantId` (null/undefined) — resolved variant deferred to Story 6.2.
- Slot labels in French: Petit-déjeuner, Déjeuner, Dîner.
- Week starts Monday; dates stored as local ISO `YYYY-MM-DD`.
- Dexie access only through `DatabaseService`.
- Bottom sheet pattern matches `pantry-add-sheet` (backdrop, drag area, French labels).
- Touch targets ≥ 44px.

**Ask First:**
- Variant chip selection on filled slots (Story 6.2).
- Live macro synthesis panel on Plan (Story 6.2).

**Never:**
- Network calls for meal plan persistence.
- Variant picker in this story.
- Shopping list generation logic.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty slot tap | No entry for date+slot | Open recipe picker sheet | N/A |
| Assign recipe | User selects recipe in picker | Entry created with recipeId, no recipeVariantId | N/A |
| Duplicate slot | Entry exists for date+slot, create called | Operation rejected | French error |
| Filled slot tap | Entry exists | Open slot detail sheet with recipe name | N/A |
| Change recipe | User picks new recipe in detail flow | Entry updated, recipeId changed, recipeVariantId cleared | N/A |
| Delete entry | User confirms delete in slot sheet | Entry removed from IndexedDB | N/A |
| Week navigation | User taps prev/next week | Grid reloads entries for new week range | N/A |
| No recipes | Picker opened, catalog empty | Empty state message, no assign action | N/A |
| Recipe deleted | Entry references removed recipe | Slot shows fallback label | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/meal-plan-entry.ts` — add `UpdateMealPlanEntryInput`, slot label helper.
- `src/app/core/database/database.service.ts` — `listMealPlanEntriesBetweenDates`, `getMealPlanEntryByDateAndSlot`, `updateMealPlanEntry`, `deleteMealPlanEntry`; duplicate guard on `createMealPlanEntry`.
- `src/app/core/database/database.service.meal-plan.spec.ts` — I/O matrix tests (new file).
- `src/app/features/meal-plan/utils/week-dates.ts` — Monday week start, 7-day strip, ISO week label.
- `src/app/features/meal-plan/services/meal-plan.service.ts` — week load, assign, update, delete with signals.
- `src/app/features/meal-plan/components/week-grid/` — day selector + 3 slot cards with « + » or recipe title.
- `src/app/features/meal-plan/components/recipe-picker-sheet/` — search, recipe list, macro preview via `RecipeMacroService` on default variant.
- `src/app/features/meal-plan/components/meal-slot-sheet/` — filled slot detail: change recipe, delete.
- `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — replace placeholder with week nav + grid + sheets.
- Reuse: `pantry-add-sheet` SCSS patterns; `RecipeMacroService`, `formatRecipeMacros`; `EmptyStateComponent`.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/meal-plan-entry.ts` — update types and slot labels.
- [x] `src/app/core/database/database.service.ts` — meal plan CRUD + duplicate guard.
- [x] `src/app/core/database/database.service.meal-plan.spec.ts` — matrix tests.
- [x] `src/app/features/meal-plan/utils/week-dates.ts` — week date helpers.
- [x] `src/app/features/meal-plan/services/meal-plan.service.ts` — feature service.
- [x] `src/app/features/meal-plan/components/week-grid/` — WeekGrid UI.
- [x] `src/app/features/meal-plan/components/recipe-picker-sheet/` — picker with search + macros.
- [x] `src/app/features/meal-plan/components/meal-slot-sheet/` — modify/delete sheet.
- [x] `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — integrate week view.

**Acceptance Criteria:**
- Given `/plan`, when I view the week, then I see 7 selectable days and 3 meal slots for the selected day with « + » on empty slots.
- Given an empty slot, when I select a recipe in the picker, then a `mealPlanEntry` is saved with `recipeId` and no `recipeVariantId`.
- Given a filled slot, when I open it, then I can change the recipe or delete the entry.
- Given the same date+slot, when I try to create a second entry, then the operation is rejected.
- Given saved entries, when I navigate weeks, then entries for the visible week reload correctly.

## Verification

**Commands:**
- `npm test` — expected: all tests pass including `database.service.meal-plan.spec.ts`.
- `npm run build` — expected: production build succeeds.

**Manual checks:**
- Open `/plan`, assign a recipe to Monday lunch, reload — entry persists.
- Tap filled slot, delete — slot returns to « + ».
- Tap filled slot, change recipe — new recipe shown.
