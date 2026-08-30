---
title: 'Story 5.2 — Synthèse macros journalière'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '5940050a8c8f2e2f0e2b0e5f3b8e2a7c4d1e9f3a'
story_key: '5-2-synthèse-macros-journalière'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-5-1-formulaire-objectifs-macros.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-3-calcul-macros-par-portion.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot see whether their planned meals meet daily macro goals; Story 5.1 alone does not close the feedback loop.

**Approach:** Aggregate per-portion macros from resolved meal-plan variants for a selected day, compare to stored goals with ±5% bar states, and display `MacroBarGroup` with a bottom sheet listing meals and macros.

## Boundaries & Constraints

**Always:**
- Resolved variant = `entry.recipeVariantId ?? recipe.defaultVariantId` (AR-14).
- Aggregation uses `RecipeMacroService.calculateForVariant` → sum `perPortion` via `addRecipeMacros`.
- Five bars: kcal, P, L, G, fibres; gram labels with explicit « g ».
- States: under/met/over at ±5%; no goal → neutral bar (value only, no fill).
- Empty day: totals 0, message « Aucun repas planifié », under state allowed but not styled as error.
- Tap any bar → bottom sheet with meals of the day and macros/portion.
- Bars expose aria-label with current value and goal when defined.

**Ask First:**
- Week grid meal assignment UI (Epic 6.1).
- Link from Plan week view (Epic 6.2).

**Never:**
- Network calls.
- Meal plan CRUD UI beyond read aggregation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Day with entries | 1+ mealPlanEntries with resolvable variants | Bars show summed per-portion macros | Skip unresolvable entries |
| Partial goals | Only kcal goal set | Other bars value-only (neutral) | N/A |
| Under target | actual < goal × 0.95 | Bar state `under`, blue fill | N/A |
| Met target | within ±5% | Bar state `met`, green fill | N/A |
| Over target | actual > goal × 1.05 | Bar state `over`, amber fill | N/A |
| Empty day | No entries for date | Bars at 0, empty message, no error styling | N/A |
| Bar tap | User taps any bar | Sheet lists slots, recipe, variant, macros/portion | N/A |
| Variant override | entry.recipeVariantId set | Uses that variant for macros | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/macro-bar-state.ts` — ±5% compare + fill percent helpers.
- `src/app/core/models/daily-macro-synthesis.ts` — view models, `buildMacroBars`, date helpers.
- `src/app/core/scoring/daily-macro-synthesis.service.ts` — daily aggregation orchestration.
- `src/app/core/database/database.service.ts` — `listMealPlanEntriesByDate`.
- `src/app/features/macro-goals/components/macro-bar/` — single bar with aria-label + tap.
- `src/app/features/macro-goals/components/macro-bar-group/` — 5 bars container.
- `src/app/features/macro-goals/components/macro-synthesis-sheet/` — meal detail bottom sheet.
- `src/app/features/macro-goals/components/macro-synthesis-section/` — date nav + synthesis block on `/goals`.
- `src/styles/_tokens.scss` — `--color-macro-under/met/over`.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/macro-bar-state.ts` — state helpers + tests.
- [x] `src/app/core/models/daily-macro-synthesis.ts` — bar builders + date helpers + tests.
- [x] `src/app/core/scoring/daily-macro-synthesis.service.ts` — aggregation service + tests.
- [x] `src/app/core/database/database.service.ts` — list entries by date.
- [x] `src/app/features/macro-goals/components/macro-bar/` — bar component.
- [x] `src/app/features/macro-goals/components/macro-bar-group/` — bar group.
- [x] `src/app/features/macro-goals/components/macro-synthesis-sheet/` — bottom sheet.
- [x] `src/app/features/macro-goals/components/macro-synthesis-section/` — synthesis section on goals page.
- [x] `src/app/features/meal-plan/meal-plan-page.component.html` — link to synthesis.

**Acceptance Criteria:**
- Given meal plan entries for a day, when I view synthesis, then 5 bars show summed resolved-variant macros vs goals.
- Given no meals, when I view synthesis, then bars are 0 and « Aucun repas planifié » is shown.
- Given a defined goal, when actual is outside ±5%, then bar shows under or over state.
- Given I tap a bar, when the sheet opens, then meals of the day list macros per portion.
- Given gram macros, when labels render, then « g » is explicit.

## Verification

**Commands:**
- `npm test` — expected: all tests pass including synthesis specs.
- `npm run build` — expected: production build succeeds.

**Manual checks:**
- Plan a meal via IndexedDB/devtools or future Epic 6 — synthesis totals update on `/goals`.
- Tap a bar — sheet shows meal rows with kcal and macros.
