---
title: 'Story 4.3 — Calcul macros par portion'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '14b2e51f6cba109e65a6f9a3c4135e13653c6ba7'
story_key: '4-3-calcul-macros-par-portion'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-2-variantes-additionnelles-et-notation.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot see nutritional macros for a recipe variant, making it hard to compare declinations.

**Approach:** Add pure macro aggregation in `core/scoring`, enrich recipe detail with preferred-reference macros per ingredient, and display total + per-portion macros on the recipe detail page for the active variant.

## Boundaries & Constraints

**Always:**
- Formula per ingredient: `(macroPer100g × quantityG) / 100` for kcal, P, L, G, fibres (FR-13, AR-5).
- Per portion = total ÷ `recipe.defaultPortions` (FR-13).
- Macros source = `Product.preferredReferenceId` only.
- UI updates when active variant changes (computed from loaded detail).
- French labels; no automatic nutritional score on recipe (AR-15).

**Ask First:**
- Edit `defaultPortions` inline (Story 4.4).
- Macro display on list or meal plan (Epic 5/6).

**Never:**
- `referenceId` on ingredients.
- Nutritional score chip on recipes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full macros | All ingredients have preferred ref macros | Total + per portion displayed | N/A |
| Missing ref | Ingredient product without preferred ref | Omit from sum; show incomplete banner | No crash |
| Zero portions | defaultPortions invalid | Should not occur (validated at create) | N/A |
| Switch variant | User selects another chip | Macros recompute for new ingredients | N/A |
| Fiber absent | fiberPer100g undefined on ref | Treat as 0 in sum | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/recipe-macros.ts` — `RecipeMacros` type + pure sum/per-portion helpers.
- `src/app/core/scoring/recipe-macro.service.ts` — service wrapping calculation from variant detail.
- `src/app/core/scoring/recipe-macro.service.spec.ts` — unit tests for formula matrix.
- `src/app/core/models/recipe-detail.ts` — optional `macrosPer100g` on ingredient detail.
- `src/app/core/database/database.service.ts` — load preferred reference macros in `getRecipeDetail`.
- `src/app/features/recipes/components/recipe-macros-panel/` — display total + per portion.
- `src/app/features/recipes/components/recipe-detail-page/` — wire computed macros for active variant.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/core/models/recipe-macros.ts` — types and pure functions.
- [ ] `src/app/core/scoring/recipe-macro.service.ts` — variant macro calculation.
- [ ] `src/app/core/scoring/recipe-macro.service.spec.ts` — matrix tests.
- [ ] `src/app/core/models/recipe-detail.ts` — ingredient macro source field.
- [ ] `src/app/core/database/database.service.ts` — enrich detail with macros.
- [ ] `src/app/features/recipes/components/recipe-macros-panel/` — UI panel.
- [ ] `src/app/features/recipes/components/recipe-detail-page/` — display macros.

**Acceptance Criteria:**
- Given a variant with ingredients linked to products with preferred references, when I view the detail page, then total and per-portion macros are shown.
- Given I switch variant tabs, when the active variant changes, then macros update immediately.
- Given an ingredient without macro source, when displayed, then a French incomplete-data notice appears and other ingredients still sum.

## Verification

**Commands:**
- `npm test -- --no-watch` — all tests pass including recipe-macro specs.
- `npm run build` — succeeds.

**Manual checks:**
- Open recipe detail, switch variants — macros change per variant.
