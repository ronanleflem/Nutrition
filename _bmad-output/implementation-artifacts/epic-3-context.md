# Epic 3 Context: Garde-manger

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Users manage home stock in grams with optional expiry and location. Pantry lines link only to generic `Product` ids (never reference ids), enabling later shopping-list generation (plan minus pantry). This epic delivers stock CRUD and DLC awareness before recipe/shopping flows consume pantry quantities.

## Stories

- Story 3.1: CRUD garde-manger
- Story 3.2: Alertes DLC et filtres

## Requirements & Constraints

- Add pantry line for an active catalogue product with `quantityG` > 0; optional `expiryDate` and `location`.
- Modify quantity or delete line; when quantity reaches 0 the row is removed automatically.
- CRUD must feel instant (< 200 ms perceived) and work fully offline.
- Quantities stored in grams only; no reference-level links on pantry rows.
- Soft-deleted products must not appear as selectable for new pantry lines.

## Technical Decisions

- Dexie tables `products` (minimal fields for linking) and `pantryItems` via schema version bump on `NutritionDb`.
- `DatabaseService` remains the sole DB gateway; features never import Dexie.
- IDs via `crypto.randomUUID()`; timestamps ISO 8601 UTC.
- `pantryItems.productId` FK to `products.id` only (AD-4, AD-11).
- Product soft delete via `deletedAt`; active lists filter `deletedAt == null`.

## UX & Interaction Patterns

- `/pantry` is the default home surface — list stock with product name, quantity (g), optional DLC and emplacement.
- Empty pantry list uses `EmptyState` with contextual CTA to add stock.
- Add/edit via bottom sheet or inline form; French UI strings.
- DLC warning badges and filters belong to story 3.2 — not this story.

## Cross-Story Dependencies

- Requires `products` table and at least read/create-minimal product API so catalogue rows exist before pantry add (full catalogue UI is Epic 2).
- Epic 7 shopping list generation will read `pantryItems` quantities by `productId`.
