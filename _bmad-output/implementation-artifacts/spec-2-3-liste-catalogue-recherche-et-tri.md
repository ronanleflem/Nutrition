---
title: 'Story 2.3 — Liste catalogue recherche et tri'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '1e850c3d7757d4a8511ca700d09c881c5a3fd1f'
story_key: '2-3-liste-catalogue-recherche-et-tri'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-2-crud-productreference-et-référence-préférée.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/mockups/products-catalog.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot quickly find products in a growing catalogue; the list lacks search and the full card presentation from the UX mockup.

**Approach:** Add instant client-side search by product name on `/products`, keep default score-desc sort from story 2.2, and polish empty/no-results states per UX-DR11.

## Boundaries & Constraints

**Always:**
- Search filters by Product `name` only; client-side for < 200 ms perceived latency (NFR-2).
- Default sort remains `nutritionalScore` desc via preferred reference (AR-6) — already in `listProductCatalog`.
- ProductCard shows name, primary store, score chip, macros summary when preferred ref exists (UX-DR3, UX-DR5).
- Tap card → product detail with ReferenceRow sorted score ↓ (story 2.2).
- Empty catalogue → EmptyState with CTA; empty search → message + clear action.

**Ask First:**
- Priority filter (mentioned in EXPERIENCE.md, not in story AC).
- Scanner FAB (story 2.4).

**Never:**
- Server-side search or network calls for filtering.

</frozen-after-approval>

## Code Map

- `src/app/features/products/utils/filter-catalog.ts` — accent-insensitive name filter.
- `src/app/features/products/products-page.component.*` — search input, filtered list, no-results UI.
- `src/app/features/products/components/empty-state/` — configurable message/CTA.
- `src/app/features/products/components/product-card/` — already enriched in 2.2 (verify only).

## Tasks & Acceptance

**Execution:**
- [x] `filter-catalog.ts` + unit tests — instant name search.
- [x] Products page search UI per mockup — NFR-2, UX search field.
- [x] No-results and empty catalogue states — UX-DR11.
- [x] Integration tests for search, score/macros display, sort inherited from 2.2.

**Acceptance Criteria:**
- Given products with references, when the catalogue loads, then each card shows name, store, score, macros summary (UX-DR3, UX-DR5).
- Given the catalogue, when displayed, then default sort is nutritionalScore desc via preferred ref (AR-6).
- Given a search query, when typing a product name, then the list filters instantly (NFR-2).
- Given tap on card, when navigating, then detail shows ReferenceRow sorted score ↓ with Préférée badge (UX-DR3, UX-DR5).
- Given empty catalogue, when no products exist, then EmptyState with create CTA appears (UX-DR11).

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass.

### Review Findings

- [x] [Review][Defer] Couverture tests page détail (banner préférence, tri références) — dette tests, comportement implémenté
