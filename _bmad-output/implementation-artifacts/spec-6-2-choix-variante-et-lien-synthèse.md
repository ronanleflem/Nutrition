---
title: 'Story 6.2 — Choix variante et lien synthèse'
type: 'feature'
created: '2026-08-31'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'c7221843a70b6c76ca363b07fb945b006f010205'
story_key: '6-2-choix-variante-et-lien-synthèse'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-6-1-vue-semaine-et-assignation-recette.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-5-2-synthèse-macros-journalière.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Planned slots show only recipe names; users cannot pick a variant at plan time or see how the day affects macro goals without leaving `/plan`.

**Approach:** Add variant chip on filled slots with a picker sheet (`VariantChipRow` + macros preview), persist `recipeVariantId`, embed `MacroSynthesisSection` synced to the selected day, and anchor-link to synthesis on Plan.

## Boundaries & Constraints

**Always:**
- Resolved variant = `entry.recipeVariantId ?? recipe.defaultVariantId` (AR-14).
- Chip label: variant name when `recipeVariantId` set; « Par défaut » when null.
- Variant picker updates only `recipeVariantId`; does not change `recipeId`.
- Reuse `VariantChipRow`, `RecipeMacroService`, `MacroSynthesisSection`.
- Synthesis reloads on day or variant change without full page navigation.
- UI in French; touch targets ≥ 44px.

**Ask First:**
- Shopping list regeneration (Epic 7).

**Never:**
- Network calls.
- Meal plan CRUD beyond variant update.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default variant | entry.recipeVariantId null | Chip shows « Par défaut »; synthesis uses defaultVariantId | N/A |
| Explicit variant | User selects variant in picker | recipeVariantId persisted; chip shows variant name | N/A |
| Variant chip tap | Filled slot with recipe | Variant picker sheet opens | N/A |
| Day change | User selects another day in week grid | Synthesis reloads for new date | N/A |
| Variant change | User picks new variant | Synthesis reloads without page navigation | N/A |
| Invalid variant | variantId not in recipe | Update rejected | French error |
| Synthesis anchor | User taps « Voir synthèse macros » | Scrolls to embedded synthesis section | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/database/database.service.ts` — `updateMealPlanEntryVariant(entryId, recipeVariantId)`.
- `src/app/core/database/database.service.meal-plan.spec.ts` — variant update tests.
- `src/app/features/meal-plan/services/meal-plan.service.ts` — variant resolution labels, `updateVariant()`.
- `src/app/features/meal-plan/components/variant-picker-sheet/` — VariantChipRow + macros preview.
- `src/app/features/meal-plan/components/week-grid/` — variant chip on filled slots, separate tap target.
- `src/app/features/macro-goals/components/macro-synthesis-section/` — optional external `date` input, hide date nav when embedded.
- `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — embed synthesis, scroll link, variant picker wiring.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/database/database.service.ts` — variant-only update API.
- [x] `src/app/core/database/database.service.meal-plan.spec.ts` — variant matrix tests.
- [x] `src/app/features/meal-plan/services/meal-plan.service.ts` — variant labels + updateVariant.
- [x] `src/app/features/meal-plan/components/variant-picker-sheet/` — picker UI.
- [x] `src/app/features/meal-plan/components/week-grid/` — variant chip display + tap.
- [x] `src/app/features/macro-goals/components/macro-synthesis-section/` — embedded date binding.
- [x] `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — synthesis embed + anchor.

**Acceptance Criteria:**
- Given a filled slot, when I tap the variant chip, then a picker shows scrollable variants with rating and macros/portion.
- Given a variant selection, when I confirm, then `recipeVariantId` is saved and the chip label updates.
- Given a slot using default variant, when displayed, then chip shows « Par défaut ».
- Given I change day or variant, when synthesis is visible on Plan, then bars update without full page reload.
- Given Plan page, when I tap « Voir synthèse macros », then I scroll to the embedded synthesis section.

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass.

**Manual checks:**
- Assign recipe, tap variant chip, select alternate variant — chip and synthesis update.
- Change day in week grid — synthesis date and bars follow.
- Tap synthesis link — page scrolls to bars section.
