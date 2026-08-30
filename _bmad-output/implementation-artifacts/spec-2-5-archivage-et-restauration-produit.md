---
title: 'Story 2.5 — Archivage et restauration produit'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '139f37f8a2b8c4e8f0e2b6f3a1d9c0e7b4a2f1d0'
story_key: '2-5-archivage-et-restauration-produit'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-4-scanner-et-enrichissement-open-food-facts.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot clean up their catalogue without losing historical links in recipes and pantry.

**Approach:** Soft-delete products via `deletedAt`, confirmation on archive, restore from Settings, and scan-time restore prompt for archived barcodes.

## Boundaries & Constraints

**Always:**
- Archive sets `deletedAt` on Product only (not references).
- Active lists and selectors exclude archived products (FR-6).
- Confirmation before archive (FR-6).
- References show « Archivé » badge when parent product is archived (FR-6).
- Restore from Paramètres → Produits archivés (FR-6).
- Scan of archived ref barcode → bottom sheet restore prompt (AR-9, UX-DR5).

**Ask First:**
- Bulk archive operations.

**Never:**
- Hard delete products referenced elsewhere.
- Auto-restore without user confirmation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Archive product | Active product on detail page | Confirm dialog → `deletedAt` set → removed from catalogue | N/A |
| Restore from settings | Archived product in list | `deletedAt` cleared → back in catalogue | N/A |
| Scan archived barcode | Ref exists, product archived | Bottom sheet « Restaurer cette référence ? » | N/A |
| Scan active barcode | Ref exists, product active | Navigate to product detail (unchanged) | N/A |
| Archived reference display | `productArchived=true` on ReferenceRow | « Archivé » badge visible | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/database/database.service.ts` — `archiveProduct`, `restoreProduct`, `listArchivedProducts`, `findReferenceByBarcode`.
- `src/app/core/ui/confirm-dialog/` — archive confirmation modal.
- `src/app/features/products/components/product-detail-page/` — archive action.
- `src/app/features/settings/components/archived-products-page/` — restore list.
- `src/app/features/products/services/scan.service.ts` — `pendingRestore` + restore flow.
- `src/app/features/products/components/scanner-page/` — restore bottom sheet.
- `src/app/features/products/components/reference-row/` — archived badge.

## Tasks & Acceptance

**Execution:**
- [x] Database archive/restore/list + barcode lookup with archived products.
- [x] Product detail archive with confirmation dialog.
- [x] Settings → Produits archivés page with restore.
- [x] Scan bottom sheet for archived barcode restore.
- [x] ReferenceRow « Archivé » badge via `productArchived` input.
- [x] Unit tests for database, scan, reference row, archived products page.

**Acceptance Criteria:**
- Given an active product, when archiving, then confirmation is shown and product disappears from active lists (FR-6).
- Given archived product, when viewing references with `productArchived`, then « Archivé » badge appears (FR-6).
- Given archived product, when restoring from Settings, then product reappears in catalogue (FR-6).
- Given archived ref barcode scan, when resolved, then bottom sheet proposes restoration (AR-9, UX-DR5).

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass.

### Review Findings

- [ ] [Review][Decision] Badge « Archivé » sur `ReferenceRow` implémenté mais jamais branché ; aucun écran ne liste les références d'un produit archivé (AC #2 FR-6 partiel) [`reference-row.component.html:14-16`, `product-detail-page.component.html:45-50`]
- [ ] [Review][Patch] Restauration via scan : `restorePendingProduct` appelle `DatabaseService` directement sans `ProductsService.loadCatalog()` [`src/app/features/products/services/scan.service.ts:83-91`]
- [x] [Review][Defer] Confirmation archivage non testée au niveau composant — dette tests, flux implémenté
- [x] [Review][Defer] Bottom sheet restauration scanner non testée en composant — dette tests
