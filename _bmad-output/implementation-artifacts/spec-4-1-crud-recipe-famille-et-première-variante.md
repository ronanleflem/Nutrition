---
title: 'Story 4.1 — CRUD Recipe famille et première variante'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '4586fa900f00c37db5a9a980c985c54dafedcc68'
story_key: '4-1-crud-recipe-famille-et-première-variante'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-1-crud-garde-manger.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The recipes surface is a placeholder; users cannot create recipe families with a first variant and ingredients, blocking meal planning and macro synthesis.

**Approach:** Bump Dexie to v5 with `recipes`, `recipeVariants`, and `recipeIngredients` tables, extend `DatabaseService` with atomic create for a recipe + first variant + ingredients, and build a French create-recipe flow with validation (≥1 step, ≥1 ingredient, preferred reference required per product).

## Boundaries & Constraints

**Always:**
- `recipeIngredients` link `variantId` + `productId` + `quantityG` only — never `referenceId` (AD-4).
- Quantities in grams; macros source is `Product.preferredReferenceId` at read time (AD-5).
- On create, set `defaultVariantId` to the first variant id automatically (AR-13).
- At least one non-empty step and one ingredient with `quantityG > 0` required to save (FR-12).
- Block ingredient add when product lacks `preferredReferenceId`; show explicit French message with link to product detail (UX-DR15).
- Features import Dexie only through `DatabaseService` (AR-2).
- UI text in French; touch targets ≥ 44px.

**Ask First:**
- Additional variants beyond the first (Story 4.2).
- Macro totals / per-portion display (Story 4.3).
- Edit or delete existing recipes (Story 4.4).
- Star rating on variants (Story 4.2).

**Never:**
- Network calls for recipe persistence.
- `referenceId` on `recipeIngredients`.
- Meal plan assignment (Epic 6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create recipe | Valid title, ≥1 step, defaultPortions > 0, first variant name, ≥1 ingredient with preferred product | `recipes`, `recipeVariants`, `recipeIngredients` rows; `defaultVariantId` = first variant id | Reject if validation fails |
| Missing step | Empty steps array or all blank | Save blocked | Inline French validation message |
| Missing ingredient | No ingredients | Save blocked | Inline French validation message |
| Zero quantity | ingredient quantityG ≤ 0 | Save blocked | Inline validation |
| Product without preferred ref | Active product, no preferredReferenceId | Ingredient add blocked | Banner: set preferred reference first; link to `/products/:id` |
| Empty catalogue | No active products with preferred ref | Create form loads; ingredient picker empty with guidance | CTA to catalogue |
| List after create | One or more recipes exist | `/recipes` shows title + default variant name subtitle | EmptyState when none |

</frozen-after-approval>

## Code Map

- `src/app/core/database/nutrition-database.ts` — schema v5: add `recipes`, `recipeVariants`, `recipeIngredients` stores; bump `NUTRITION_DB_VERSION`.
- `src/app/core/models/recipe.ts` — `Recipe`, `CreateRecipeInput`, factory helpers.
- `src/app/core/models/recipe-variant.ts` — `RecipeVariant`, create helper.
- `src/app/core/models/recipe-ingredient.ts` — `RecipeIngredient`, create helper.
- `src/app/core/models/recipe-list-item.ts` — joined view: recipe + default variant name for list.
- `src/app/core/database/database.service.ts` — `createRecipeWithFirstVariant`, `listRecipes`, `getRecipeWithVariants`; transactional put.
- `src/app/core/database/database.service.recipes.spec.ts` — unit tests for I/O matrix rows.
- `src/app/features/recipes/services/recipes.service.ts` — feature service with signals (mirror `ProductsService`).
- `src/app/features/recipes/recipes-page.component.ts` — list, EmptyState, FAB link to create.
- `src/app/features/recipes/components/recipe-form-page/` — create form: metadata, dynamic steps, first variant name, ingredient rows with product picker.
- `src/app/features/recipes/recipes.routes.ts` — add `/new` route for create form.
- Reuse: `EmptyStateComponent` from products (parameterize routerLink via input or duplicate thin wrapper); `ProductsService.listActiveProducts` / catalog for product picker; form patterns from `product-form-page`.
- Read-only: existing `DatabaseService` product APIs for preferred-ref check.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/core/models/recipe.ts` — Recipe model and create input types.
- [ ] `src/app/core/models/recipe-variant.ts` — RecipeVariant model.
- [ ] `src/app/core/models/recipe-ingredient.ts` — RecipeIngredient model.
- [ ] `src/app/core/models/recipe-list-item.ts` — list view type.
- [ ] `src/app/core/database/nutrition-database.ts` — Dexie v5 migration.
- [ ] `src/app/core/database/database.service.ts` — recipe create + list APIs.
- [ ] `src/app/core/database/database.service.recipes.spec.ts` — matrix coverage tests.
- [ ] `src/app/features/recipes/services/recipes.service.ts` — reactive recipe list + create.
- [ ] `src/app/features/recipes/components/recipe-form-page/` — create recipe UI with validation.
- [ ] `src/app/features/recipes/recipes-page.component.ts` — list + empty state + navigation.
- [ ] `src/app/features/recipes/recipes.routes.ts` — wire create route.
- [ ] `src/app/features/products/components/empty-state/empty-state.component.ts` — optional `ctaLink` input for reuse.

**Acceptance Criteria:**
- Given active products with `preferredReferenceId`, when I create a recipe with title, steps, portions, first variant, and ingredients, then IndexedDB contains linked `recipes`, `recipeVariants`, and `recipeIngredients` rows with `defaultVariantId` set.
- Given a product without preferred reference, when I try to add it as an ingredient, then the UI blocks with an explicit French message.
- Given offline mode, when I create a recipe, then persistence succeeds without network.
- Given saved recipes, when I open `/recipes`, then I see each family title with its default variant name as subtitle.

## Verification

**Commands:**
- `npm test` — expected: all tests pass including `database.service.recipes.spec.ts`.
- `npm run build` — expected: production build succeeds with Dexie v5 migration.

**Manual checks:**
- Open `/recipes/new`, create a recipe with one step and one ingredient from a product with preferred ref — redirected to list, recipe visible.
- Try adding ingredient from product without preferred ref — blocked with message and product link.
