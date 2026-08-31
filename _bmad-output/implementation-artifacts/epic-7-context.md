# Epic 7 Context: Liste de courses et mode magasin

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Let users generate a shopping list from their meal plan minus pantry stock, edit it manually, and check items off in a full-screen store mode optimized for one-handed use offline.

## Stories

- Story 7.1: Génération automatique liste
- Story 7.2: Édition manuelle et régénération
- Story 7.3: Mode Courses plein écran

## Requirements & Constraints

- Shopping list items link only to generic `productId` (never `referenceId`).
- Auto items: `needed = max(0, plannedG - pantryG)` aggregated by product from resolved recipe variants in the plan window (current week by default).
- Exclude zero-gram needs; persist items with `source: auto` or `manual`.
- Regeneration (Story 7.2) recalculates auto items only; manual items preserved.
- Display `recommendedStores[]` per product for in-store guidance.
- Generation must complete in under 2 seconds for 21 planned meals.
- French UI; mobile-first; touch targets ≥ 44px (≥ 52px in store mode).
- Feature folder: `shopping-list`; route `/shopping` (bottom nav « Courses »).

## Technical Decisions

- `ShoppingListItem`: `id`, `productId`, `quantityG`, `checked`, `source` (`auto`|`manual`), `createdAt`.
- Dexie store `shoppingListItems` with indexes on `productId`, `source`, `checked`.
- Plan window: Monday–Sunday of current week (reuse `week-dates` helpers).
- Resolved variant per entry: `recipeVariantId ?? recipe.defaultVariantId`.
- Pantry quantity per product = sum of all `pantryItems` for that `productId`.
- IndexedDB access only via `DatabaseService`.

## UX & Interaction Patterns

- Normal list: auto + manual rows, store chips under product name, « Générer depuis le plan » CTA.
- Empty plan → `EmptyState` with link to Plan.
- Store mode (Story 7.3): full screen, hides bottom nav, large check rows, « Terminer » returns to list.
- `RegenerateBanner` when plan changed since last auto generation (Story 7.2).

## Cross-Story Dependencies

- Depends on Epic 3 pantry quantities, Epic 4 recipe ingredients, Epic 6 meal plan entries and variant resolution.
- Epic 8 backup must include `shoppingListItems` table when export/import ships.
