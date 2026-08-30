# Epic 4 Context: Recettes familles et variantes

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Users build a personal recipe book as **families** with named **variants** (product substitution or quantity scaling), rate variants with stars, and see macros per portion computed from catalogue products. This epic delivers the recipe data model and CRUD that Epic 5 (macro synthesis) and Epic 6 (meal planning) depend on.

## Stories

- Story 4.1: CRUD Recipe famille et première variante
- Story 4.2: Variantes additionnelles et notation
- Story 4.3: Calcul macros par portion
- Story 4.4: Modifier et supprimer recette

## Requirements & Constraints

- Create a `Recipe` with title, `steps[]`, optional `durationMin`, `defaultPortions`, optional `tags`, and at least one `RecipeVariant` with ingredients.
- At least one step and one ingredient are required to save.
- Each ingredient links `variantId` + `productId` + `quantityG` (grams only).
- Adding an ingredient is blocked when the product has no `preferredReferenceId`; show an explicit message directing the user to set a preferred reference first.
- Support multiple variants per family: substitution (different product), scale (different quantities), or fully distinct ingredient lists.
- Optional `RecipeVariant.rating` (1–5 stars) on the variant, not the family; optional `Recipe.notes` on the family.
- User can set `defaultVariantId`; auto-set on the first variant at creation.
- Display total macros (kcal, protein, fat, carbs, fiber) and per-portion values (`total / defaultPortions`); recalculate immediately when ingredients or portions change.
- No automatic nutritional score on recipes or variants — user judges via displayed macros.
- Edit persists all changes; deleting a recipe referenced in the meal plan requires confirmation and removes associated `mealPlanEntries`.
- Recipe CRUD must work fully offline.

## Technical Decisions

- Dexie tables: `recipes`, `recipeVariants`, `recipeIngredients` (schema version bump on `NutritionDb`).
- `Recipe` = shared family (title, steps, `defaultPortions`, tags, `defaultVariantId`, notes); `RecipeVariant` = named declination with its own ingredient list.
- `recipeIngredients` always store `productId`, never `referenceId` (AD-4); macro source is `Product.preferredReferenceId` (AD-5).
- Macro formula per ingredient: `(macroPer100g × quantityG) / 100`; variant total = sum across ingredients; per portion = total ÷ `defaultPortions`.
- IDs via `crypto.randomUUID()`; timestamps ISO 8601 UTC; `DatabaseService` remains the sole DB gateway.
- Feature module: `features/recipes`; macro calculation logic in `core/scoring`.
- Resolved variant for downstream consumers: `mealPlanEntry.recipeVariantId ?? recipe.defaultVariantId` (AD-14) — Epic 6 implements the picker; Epic 4 must expose variant data correctly.

## UX & Interaction Patterns

- Route `/recipes`: list shows family title with default variant name as subtitle; empty list uses `EmptyState` with CTA to create a recipe.
- Recipe detail uses tabs or segments per variant; macros shown per portion for the active variant.
- `VariantChipRow` (horizontal scroll, name + star rating) is the shared variant-selection pattern — used in recipe detail and later in meal plan (UX-DR7).
- Ingredient editing via bottom sheet or inline form; edit/delete accessible from recipe detail page (long-press context menu on list cards — post-MVP).
- Product without preferred reference: actionable banner pattern already established in catalogue (UX-DR15); recipe ingredient add reuses the same blocking rule.
- French UI strings throughout.

## Cross-Story Dependencies

- **Epic 2 (Catalogue):** active products with `preferredReferenceId` must exist before ingredients can be added; archived products remain on existing recipes with an "archived" indicator.
- **Epic 6 (Plan):** meal plan assignment and variant picker consume recipes created here; recipe deletion must clean up `mealPlanEntries`.
- **Epic 5 (Synthèse):** daily macro aggregation sums per-portion macros from resolved variants of planned entries — depends on accurate macro calculation from this epic.
