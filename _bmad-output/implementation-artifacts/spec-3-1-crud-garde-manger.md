---
title: 'Story 3.1 — CRUD garde-manger'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e588a0abfb3e992c3dac0193dc05e04e212ffb54'
story_key: '3-1-crud-garde-manger'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-2-databaseservice-et-schema-dexie-initial.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The pantry surface is a placeholder; users cannot record stock quantities locally, blocking shopping-list and meal flows.

**Approach:** Bump Dexie to v2 with `products` and `pantryItems` tables, extend `DatabaseService` with pantry CRUD (auto-delete at quantity 0), and build a French pantry list UI with add/edit/delete via bottom sheet.

## Boundaries & Constraints

**Always:**
- `pantryItems` link `productId` only — never `referenceId` (AD-4).
- Quantities in grams (`quantityG`); delete row when `quantityG <= 0` (FR-10).
- Only active products (`deletedAt == null`) selectable for new lines.
- Features import Dexie only through `DatabaseService` (AR-2).
- UI text in French; touch targets ≥ 44px.

**Ask First:**
- Full product catalogue CRUD UI (Epic 2).
- DLC warning badges and sort/filter (Story 3.2).

**Never:**
- Network calls for pantry persistence.
- Reference-level pantry links.
- Pull-to-refresh (Story 3.2 / polish).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add line | Active product, quantityG > 0 | Row in `pantryItems` with optional expiryDate/location | Reject invalid product or quantity ≤ 0 |
| Update quantity | Existing row, new quantityG > 0 | Row updated, `updatedAt` refreshed | N/A |
| Zero quantity | Update quantityG to 0 | Row deleted from `pantryItems` | N/A |
| Delete line | User deletes row | Row removed | N/A |
| Soft-deleted product | Product with deletedAt set | Excluded from picker; existing lines still show name if loaded | N/A |
| Empty catalogue | No active products | Add sheet offers minimal product name field then continues add | Validation if name empty |
| Duplicate product | Second add same productId | Second row allowed (separate lines) | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/database/nutrition-database.ts` — schema v2: `products`, `pantryItems` stores; bump `NUTRITION_DB_VERSION`.
- `src/app/core/models/product.ts` — `Product` interface + `createProduct(name)` factory.
- `src/app/core/models/pantry-item.ts` — `PantryItem` + `PantryItemWithProduct` view type.
- `src/app/core/database/database.service.ts` — product list/create minimal + pantry CRUD; auto-delete on zero.
- `src/app/core/database/database.service.pantry.spec.ts` — unit tests for I/O matrix rows.
- `src/app/features/pantry/pantry.service.ts` — feature service wrapping DatabaseService with signals.
- `src/app/features/pantry/pantry-page.component.ts` — list UI, empty state, FAB add.
- `src/app/features/pantry/pantry-add-sheet.component.ts` — bottom sheet add/edit form.
- `src/app/features/pantry/pantry-page.component.spec.ts` — smoke tests for list and empty state.
- Continuity: `DatabaseService.initialize()` pattern from spec-1-2; shell layout from spec-1-3.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/product.ts` — Product model and factory.
- [x] `src/app/core/models/pantry-item.ts` — PantryItem model and joined view type.
- [x] `src/app/core/database/nutrition-database.ts` — Dexie v2 schema migration.
- [x] `src/app/core/database/database.service.ts` — product + pantry API methods.
- [x] `src/app/core/database/database.service.pantry.spec.ts` — matrix coverage tests.
- [x] `src/app/features/pantry/pantry.service.ts` — reactive pantry list + mutations.
- [x] `src/app/features/pantry/pantry-add-sheet.component.ts` — add/edit bottom sheet.
- [x] `src/app/features/pantry/pantry-page.component.ts` — list, empty state, actions.
- [x] `src/app/features/pantry/pantry-page.component.spec.ts` — component tests.

**Acceptance Criteria:**
- Given an active product in the catalogue, when I add a pantry line with quantityG > 0, then a `pantryItems` row exists linked by `productId` only.
- Given an existing pantry line, when I change quantity or delete it, then IndexedDB reflects the change without network.
- Given quantity updated to 0, when save completes, then the pantry row is removed automatically.
- Given offline mode, when I perform pantry CRUD, then all operations succeed locally.

## Spec Change Log

## Verification

**Commands:**
- `npm test` — expected: all tests pass including pantry DatabaseService and pantry page specs.
- `npm run build` — expected: production build succeeds with Dexie v2 migration.

**Manual checks:**
- Open `/pantry`, add a product and quantity, edit quantity to 0 — line disappears.
