# Epic 2 Context: Catalogue produit deux niveaux et scan

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable users to build and maintain a two-level product catalogue: generic Products (food categories) and store-specific ProductReferences with macros and nutritional scores. Users can scan barcodes in-store and enrich references via read-only Open Food Facts lookups. This epic delivers the catalogue foundation before pantry, recipes, and shopping list features consume product data.

## Stories

- Story 2.1: CRUD Product générique
- Story 2.2: CRUD ProductReference et référence préférée
- Story 2.3: Liste catalogue recherche et tri
- Story 2.4: Scanner et enrichissement Open Food Facts
- Story 2.5: Archivage et restauration produit

## Requirements & Constraints

- Products are generic food items (name, category, priority, notes); references hold store-specific macros per 100 g.
- All catalogue data persists locally in IndexedDB; no backend.
- Active lists exclude soft-deleted records (`deletedAt == null`).
- Default list sort uses preferred reference nutritional score descending; falls back to product name when no reference exists.
- Priority badges must have textual accessible labels, not color alone.
- Open Food Facts is the only external API — GET only, no personal data sent.
- Barcode lives on ProductReference, not Product.
- UI and messages in French; mobile-first with large touch targets.

## Technical Decisions

- `products` and `productReferences` tables per data model; Dexie schema version increments per table addition.
- Only `DatabaseService` in `core/database/` accesses Dexie; feature modules use injected services.
- IDs via `crypto.randomUUID()`; timestamps ISO 8601 UTC; soft delete via nullable `deletedAt`.
- `NutritionalScoreService` computes and persists scores on reference save (story 2.2+).
- `preferredReferenceId` on Product drives canonical macros and primary store display.
- Feature folder: `src/app/features/products/` with lazy route `/products`.

## UX & Interaction Patterns

- Products tab shows searchable catalogue with `ProductCard` (priority dot, name, store, score chip, macros summary).
- FAB scan button for barcode (story 2.4); manual entry fallback always available.
- Empty catalogue shows `EmptyState` with create CTA.
- Priority colors: green / yellow / gray dots with aria-labels.
- Score chip is neutral (no traffic-light coloring on score itself).
- Tap card opens detail with references sorted by score.

## Cross-Story Dependencies

- Epic 1 (PWA shell, DatabaseService, routing) must be complete.
- Story 2.1 (Product model + table) blocks 2.2–2.5.
- Story 2.2 (references + preferred ref) blocks 2.3 sorting/macros display and recipe macro calculations.
- Story 2.4 depends on 2.2 for reference creation after scan.
- Story 2.5 (archive) depends on 2.1 Product soft-delete field.
