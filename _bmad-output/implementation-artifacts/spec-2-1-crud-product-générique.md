---
title: 'Story 2.1 — CRUD Product générique'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'e588a0abfb3e992c3dac0193dc05e04e212ffb54'
story_key: '2-1-crud-product-générique'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-4-service-worker-shell-offline.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot create or manage generic food products in the catalogue; the Products tab is a placeholder with no IndexedDB persistence.

**Approach:** Add the `products` Dexie table and `Product` model behind `DatabaseService`, then build create/edit/list UI on `/products` with accessible priority badges and active-only filtering.

## Boundaries & Constraints

**Always:**
- Full `Product` model per data-model.md; form exposes name (required), category, priority (`green`|`yellow`|`gray`), notes.
- Dexie schema v2 adds `products: 'id'`; only `core/database/` imports dexie.
- List shows active products only (`deletedAt == null`), sorted by name (locale `fr`) until preferred-reference score exists in story 2.2.
- Priority badge includes French `aria-label` (UX-DR5, UX-DR12).
- UUID ids and ISO UTC timestamps on create/update (AR-17).
- French UI strings; no network calls.

**Ask First:**
- Adding `productReferences` table or OFF integration in this story.
- Search/filter UI (story 2.3).

**Never:**
- Soft-delete/archive UI (story 2.5).
- Scanner FAB or barcode flows (story 2.4).
- Score chip or macros display from references (stories 2.2–2.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create product | Valid name + optional fields | Row persisted; appears in list | N/A |
| Create without name | Empty/whitespace name | Form blocked; no DB write | Inline French error |
| List active only | Mix of active + soft-deleted | Only `deletedAt == null` shown | N/A |
| Edit product | Changed fields | `updatedAt` refreshed; list reflects changes | N/A |
| Empty catalogue | No products | EmptyState with CTA to create | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/product.ts` — `Product`, `ProductPriority`, `createProduct()`, `isActiveProduct()`.
- `src/app/core/database/nutrition-database.ts` — bump `NUTRITION_DB_VERSION` to 2; add `products` store.
- `src/app/core/database/database.service.ts` — `listActiveProducts()`, `getProduct()`, `createProduct()`, `updateProduct()`.
- `src/app/core/database/database.service.spec.ts` — product CRUD, active filter, timestamps.
- `src/app/features/products/services/products.service.ts` — feature façade over DatabaseService (no Dexie import).
- `src/app/features/products/components/priority-badge/` — dot + French aria-label.
- `src/app/features/products/components/product-card/` — name, category, priority (no score/macros yet).
- `src/app/features/products/components/product-form/` — reactive form create/edit.
- `src/app/features/products/components/empty-state/` — empty catalogue CTA.
- `src/app/features/products/products-page.component.ts` — list + navigation to form routes.
- `src/app/features/products/products.routes.ts` — `''`, `new`, `:id/edit`.
- `src/app/app.routes.spec.ts` — update `/products` expectation.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/product.ts` — Product model and factory — data-model alignment.
- [x] `src/app/core/database/nutrition-database.ts` — schema v2 products table — AR-2, AR-3.
- [x] `src/app/core/database/database.service.ts` — product CRUD API — sole DB gateway.
- [x] `src/app/core/database/database.service.spec.ts` — matrix coverage — persistence guarantees.
- [x] `src/app/features/products/services/products.service.ts` — feature service — keeps features Dexie-free.
- [x] `src/app/features/products/components/priority-badge/` — accessible badge — UX-DR5, UX-DR12.
- [x] `src/app/features/products/components/product-form/` — create/edit form — FR-5 fields.
- [x] `src/app/features/products/components/product-card/` + `empty-state/` — list presentation.
- [x] `src/app/features/products/products-page.component.ts` + `products.routes.ts` — catalogue screen and routes.
- [x] Component specs + `app.routes.spec.ts` update — regression safety.

**Acceptance Criteria:**
- Given the Products tab, when I create a Product with required name and optional category/priority/notes, then it appears in the list sorted by name (FR-5, AR-3).
- Given Dexie initialization, when the app starts, then the `products` table exists via DatabaseService (AR-2, AR-17).
- Given active and archived products, when the list loads, then only `deletedAt == null` records appear (FR-6).
- Given a priority badge, when rendered, then it has a French textual aria-label (UX-DR5, UX-DR12).

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass including new product specs.

### Review Findings

- [ ] [Review][Patch] Formulaire produit : erreurs DB silencieuses [`src/app/features/products/components/product-form-page/product-form-page.component.ts:72-85`]
- [ ] [Review][Patch] Édition produit : `route.snapshot` sans réabonnement `paramMap` [`src/app/features/products/components/product-form-page/product-form-page.component.ts:33-54`]
- [x] [Review][Defer] Couverture tests `ProductFormPageComponent` absente — dette de tests, pré-existant au périmètre review
