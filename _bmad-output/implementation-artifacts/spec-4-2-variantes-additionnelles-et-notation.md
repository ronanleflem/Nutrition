---
title: 'Story 4.2 — Variantes additionnelles et notation'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '01f14e100bf538f7caaf6939c751759cc2b2da43'
story_key: '4-2-variantes-additionnelles-et-notation'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-1-crud-recipe-famille-et-première-variante.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users can only create a recipe with one variant; they cannot add alternative declinations or rate variants to compare them.

**Approach:** Extend `DatabaseService` with recipe detail, add-variant, rating, and set-default-variant APIs; build a recipe detail page with horizontal variant chips (tabs), star rating, and a form to add additional variants with their own ingredients.

## Boundaries & Constraints

**Always:**
- Each variant has its own ingredient list on `variantId` (AR-13).
- `rating` is 1–5 integer on `RecipeVariant`, optional (AR-15).
- `defaultVariantId` must reference an existing variant of the recipe (AR-13).
- Ingredient rules from 4.1 apply: `productId` only, preferred ref required, quantityG > 0.
- Variant chip row is the shared selection pattern (UX-DR7).
- French UI; touch targets ≥ 44px.

**Ask First:**
- Macro totals display (Story 4.3).
- Edit/delete recipe family (Story 4.4).

**Never:**
- Automatic nutritional score on recipe.
- Meal plan variant picker (Epic 6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add variant | Existing recipe, name, ≥1 ingredient | New `recipeVariants` + `recipeIngredients` rows | Validation errors |
| Set rating | variantId, rating 1–5 | `rating` persisted on variant | Reject out-of-range |
| Clear rating | rating null | `rating` removed | N/A |
| Set default | recipeId, variantId belonging to recipe | `defaultVariantId` updated | Reject foreign variant |
| Detail view | Recipe with 2+ variants | Segments show each variant; active shows ingredients | N/A |
| List subtitle | defaultVariantId changed | List shows new default variant name | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/recipe-detail.ts` — joined view: recipe + variants with ingredients and product names.
- `src/app/core/database/database.service.ts` — `getRecipeDetail`, `addRecipeVariant`, `updateVariantRating`, `setDefaultVariant`; extract `validateRecipeIngredients`.
- `src/app/core/database/database.service.recipes.spec.ts` — extend tests for 4.2 matrix rows.
- `src/app/features/recipes/components/variant-chip-row/` — horizontal chips with name, stars, selection.
- `src/app/features/recipes/components/star-rating/` — 1–5 star input/display.
- `src/app/features/recipes/components/recipe-detail-page/` — detail with chip tabs, steps, ingredients, rating, set-default, add-variant CTA.
- `src/app/features/recipes/components/recipe-variant-form-page/` — add variant form (reuse ingredient patterns from recipe-form).
- `src/app/features/recipes/recipes-page.component.html` — link cards to detail.
- `src/app/features/recipes/recipes.routes.ts` — `/:id`, `/:id/variants/new`.
- `src/app/features/recipes/services/recipes.service.ts` — wrap new DB methods.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/core/models/recipe-detail.ts` — detail view types.
- [ ] `src/app/core/database/database.service.ts` — detail, add variant, rating, set default.
- [ ] `src/app/core/database/database.service.recipes.spec.ts` — 4.2 matrix tests.
- [ ] `src/app/features/recipes/components/variant-chip-row/` — chip row component.
- [ ] `src/app/features/recipes/components/star-rating/` — star rating component.
- [ ] `src/app/features/recipes/components/recipe-detail-page/` — detail page with segments.
- [ ] `src/app/features/recipes/components/recipe-variant-form-page/` — add variant form.
- [ ] `src/app/features/recipes/recipes.routes.ts` — new routes.
- [ ] `src/app/features/recipes/recipes-page.component.html` — navigable list cards.
- [ ] `src/app/features/recipes/services/recipes.service.ts` — service methods.

**Acceptance Criteria:**
- Given an existing recipe, when I add a named variant with ingredients, then a new variant and its ingredients are persisted.
- Given a variant, when I set a 1–5 star rating, then the rating is saved on that variant.
- Given multiple variants, when I set one as default, then `defaultVariantId` updates and the list subtitle reflects it.
- Given a recipe with variants, when I open its detail page, then I see segment tabs per variant with ingredients for the active one.

## Verification

**Commands:**
- `npm test -- --no-watch` — all tests pass including extended recipes specs.
- `npm run build` — production build succeeds.

**Manual checks:**
- Open a recipe detail, add a second variant, rate it, set as default — list subtitle updates.
