---
title: 'Story 7.1 — Génération automatique liste'
type: 'feature'
created: '2026-08-31'
status: 'done'
review_loop_iteration: 0
baseline_commit: '2d67fc8'
story_key: '7-1-génération-automatique-liste'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md'
  - '{project-root}/src/app/features/meal-plan/utils/week-dates.ts'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/shopping` is a placeholder; users cannot generate a shopping list from their meal plan minus pantry stock, blocking the core shopping workflow.

**Approach:** Add `shoppingListItems` persistence, a `generateFromPlan` algorithm for the current week (plan ingredients minus pantry, aggregated by `productId`), and a shopping list page with generate CTA, item rows showing quantity and `recommendedStores`, and empty states.

## Boundaries & Constraints

**Always:**
- `needed = max(0, plannedG - pantryG)` per `productId`; exclude zero-gram items.
- Auto-generated items use `source: auto`, `checked: false`.
- Plan window = Monday–Sunday of current week (local dates).
- Resolved variant = `entry.recipeVariantId ?? recipe.defaultVariantId`.
- Pantry stock = sum of all `pantryItems.quantityG` per `productId`.
- Regeneration deletes existing `source: auto` items before inserting new ones; manual items untouched (safe even if none exist yet).
- Display `Product.recommendedStores` as ordered store chips (use `STORE_LABELS`).
- Dexie access only through `DatabaseService`.
- French UI; touch targets ≥ 44px on interactive controls.

**Ask First:**
- Manual item CRUD and regenerate banner (Story 7.2).
- Store mode full-screen checking (Story 7.3).

**Never:**
- Network calls for list persistence.
- Checkbox / store-mode interactions in this story.
- Backend or cloud sync.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Generate with plan + pantry | Entries in current week, pantry partial | Auto items with needed quantities only | N/A |
| Pantry covers need | plannedG ≤ pantryG for product | Product excluded from list | N/A |
| Aggregate same product | Same product in multiple meals | Single line with summed neededG | N/A |
| Empty plan week | No meal plan entries Mon–Sun | EmptyState, no auto items created | N/A |
| Variant resolution | entry.recipeVariantId null | Uses defaultVariantId ingredients | N/A |
| Explicit variant | entry.recipeVariantId set | Uses that variant's ingredients | N/A |
| Regenerate | Existing auto items | Old auto deleted, new auto inserted | N/A |
| Archived product | Ingredient references archived product | Still listed with fallback name | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/shopping-list-item.ts` — new model + factory.
- `src/app/core/database/nutrition-database.ts` — Dexie v8 `shoppingListItems` store.
- `src/app/core/database/database.service.ts` — `listShoppingListItemsWithProducts`, `generateShoppingListFromCurrentWeek`, `deleteAutoShoppingListItems`.
- `src/app/core/database/database.service.shopping-list.spec.ts` — I/O matrix tests.
- `src/app/features/shopping-list/services/shopping-list.service.ts` — load + generate with signals.
- `src/app/features/shopping-list/components/shopping-row/` — product name, quantity, store chips (display-only).
- `src/app/features/shopping-list/shopping-list-page.component.ts/html/scss` — replace placeholder.
- Reuse: `week-dates.ts` (`getMondayOfWeek`, `getWeekDays`, `getIsoWeekLabel`); `EmptyStateComponent`; `STORE_LABELS` from `core/models/store.ts`.
- Read-only: `meal-plan.service.ts` variant resolution pattern; `database.service.meal-plan.spec.ts` seed helpers.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/shopping-list-item.ts` — model types and `createShoppingListItem`.
- [x] `src/app/core/database/nutrition-database.ts` — v8 migration with `shoppingListItems`.
- [x] `src/app/core/database/database.service.ts` — generation algorithm + list queries.
- [x] `src/app/core/database/database.service.shopping-list.spec.ts` — matrix coverage.
- [x] `src/app/features/shopping-list/services/shopping-list.service.ts` — feature service.
- [x] `src/app/features/shopping-list/components/shopping-row/` — row UI with stores.
- [x] `src/app/features/shopping-list/shopping-list-page.component.ts/html/scss` — page with generate + empty states.
- [x] `src/app/app.routes.spec.ts` — update `/shopping` expectation.

**Acceptance Criteria:**
- Given a meal plan and pantry for the current week, when I tap « Générer depuis le plan », then auto items show `max(0, planned − pantry)` per product, excluding zero grams.
- Given an empty plan for the current week, when I open Courses, then I see an EmptyState with guidance to plan meals.
- Given generated items, when I view the list, then each row shows product name, quantity in grams, and `recommendedStores` chips.
- Given regeneration, when I generate again, then previous auto items are replaced and manual items (if any) remain.

## Verification

**Commands:**
- `npm test` — expected: all tests pass including `database.service.shopping-list.spec.ts`.
- `npm run build` — expected: production build succeeds.

**Manual checks:**
- Plan 2 meals using same ingredient, set partial pantry stock, generate — single aggregated line with correct grams.
- Empty week plan — EmptyState on `/shopping`.

## Suggested Review Order

**Generation algorithm**

- Core plan-minus-pantry aggregation with variant resolution and auto-item replacement.
  [`database.service.ts:988`](../../src/app/core/database/database.service.ts#L988)

**Persistence**

- Dexie v8 migration adding the shoppingListItems store.
  [`nutrition-database.ts:87`](../../src/app/core/database/nutrition-database.ts#L87)

- ShoppingListItem model and factory with source/checked fields.
  [`shopping-list-item.ts:1`](../../src/app/core/models/shopping-list-item.ts#L1)

**Feature UI**

- Page orchestration: week label, generate CTA, empty states, item list.
  [`shopping-list-page.component.html:1`](../../src/app/features/shopping-list/shopping-list-page.component.html#L1)

- Row display with product name, quantity, and recommended store chips.
  [`shopping-row.component.html:1`](../../src/app/features/shopping-list/components/shopping-row/shopping-row.component.html#L1)

- Service wiring week range to database generation.
  [`shopping-list.service.ts:1`](../../src/app/features/shopping-list/services/shopping-list.service.ts#L1)

**Tests**

- I/O matrix coverage for generation edge cases.
  [`database.service.shopping-list.spec.ts:1`](../../src/app/core/database/database.service.shopping-list.spec.ts#L1)

## Spec Change Log

## Design Notes

Generation loops meal plan entries → resolves variant → sums ingredient `quantityG` by `productId`. Pantry map built from pantry items summed by product. Sort display by product name (fr locale).
