---
title: 'Story 7.2 — Édition manuelle et régénération'
type: 'feature'
created: '2026-08-31'
status: 'done'
review_loop_iteration: 0
baseline_commit: '72e2464'
story_key: '7-2-édition-manuelle-et-régénération'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-7-1-génération-automatique-liste.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot add off-plan items, edit quantities, check items, or regenerate auto lines after plan changes without losing manual entries.

**Approach:** Add manual item CRUD, checkbox toggle, edit sheet, plan fingerprint in `appSettings`, and `RegenerateBanner` when the current-week plan diverges from the last auto generation.

## Boundaries & Constraints

**Always:**
- Manual items: `source: manual`, badge « manuel » in UI.
- Regeneration recalculates only `auto` items; manual items keep quantity and `checked`.
- Auto and manual lines for the same `productId` coexist as separate rows.
- Plan staleness = fingerprint mismatch vs `appSettings.shoppingListPlanFingerprint`; banner only when auto items exist.
- Fingerprint from sorted current-week `mealPlanEntries` (`date`, `slot`, `recipeId`, `recipeVariantId`).
- French UI; touch targets ≥ 44px.

**Ask First:**
- Store mode full-screen (Story 7.3).

**Never:**
- Modify manual items during auto regeneration.
- Network calls.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add manual | productId + quantityG | Item `source: manual`, badge shown | French error if invalid |
| Edit quantity | Any item, new quantity > 0 | Updated quantityG | French error |
| Delete item | Any item id | Row removed | N/A |
| Toggle checked | Any item | `checked` flipped, visual strikethrough | N/A |
| Plan changed | Auto items exist, fingerprint differs | RegenerateBanner visible | N/A |
| Regenerate | Manual + auto items | Auto replaced; manual unchanged | N/A |
| Same product | Manual + auto same productId | Two separate rows | N/A |
| Delete on qty 0 | quantityG set to 0 | Item deleted | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/app-settings.ts` — add `shoppingListPlanFingerprint?`.
- `src/app/core/database/database.service.ts` — manual CRUD, fingerprint save/check, update generate.
- `src/app/core/database/database.service.shopping-list.spec.ts` — new matrix rows.
- `src/app/features/shopping-list/services/shopping-list.service.ts` — CRUD, `planStale` signal.
- `src/app/features/shopping-list/components/regenerate-banner/` — stale plan CTA.
- `src/app/features/shopping-list/components/shopping-item-sheet/` — add/edit manual + edit any item.
- `src/app/features/shopping-list/components/shopping-row/` — checkbox, manual badge, checked style.
- `src/app/features/shopping-list/shopping-list-page.component.*` — integrate banner, add button, sheets.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/app-settings.ts` — fingerprint field.
- [x] `src/app/core/database/database.service.ts` — CRUD + fingerprint + stale check.
- [x] `src/app/core/database/database.service.shopping-list.spec.ts` — 7.2 tests.
- [x] `src/app/features/shopping-list/services/shopping-list.service.ts` — expose CRUD + stale.
- [x] `src/app/features/shopping-list/components/regenerate-banner/` — banner UI.
- [x] `src/app/features/shopping-list/components/shopping-item-sheet/` — add/edit sheet.
- [x] `src/app/features/shopping-list/components/shopping-row/` — checkbox + badge.
- [x] `src/app/features/shopping-list/shopping-list-page.component.*` — wire everything.

**Acceptance Criteria:**
- Given a list, when I add a manual item, then it shows badge « manuel » and `source: manual`.
- Given any item, when I edit quantity, toggle checked, or delete, then changes persist.
- Given plan changed since last generation with auto items, when I open Courses, then RegenerateBanner appears.
- Given manual items, when I regenerate, then only auto items are recalculated and manual lines are preserved.

## Verification

**Commands:**
- `npm test` — all tests pass including shopping-list spec.
- `npm run build` — succeeds.

**Manual checks:**
- Add manual item, regenerate — manual line unchanged.
- Change plan entry, reopen Courses — banner shows.

## Spec Change Log

## Design Notes

Fingerprint stored on each successful auto generation. Banner offers one-tap regenerate reusing existing algorithm.

## Suggested Review Order

**Plan staleness**

- Fingerprint utility and appSettings field for last-generated plan snapshot.
  [`meal-plan-fingerprint.ts:1`](../../src/app/core/utils/meal-plan-fingerprint.ts#L1)

- Stale detection and fingerprint save on auto generation.
  [`database.service.ts:1052`](../../src/app/core/database/database.service.ts#L1052)

**Manual CRUD**

- Create, update (qty/checked), delete shopping list items.
  [`database.service.ts:1056`](../../src/app/core/database/database.service.ts#L1056)

**Feature UI**

- RegenerateBanner when plan diverges from fingerprint.
  [`regenerate-banner.component.html:1`](../../src/app/features/shopping-list/components/regenerate-banner/regenerate-banner.component.html#L1)

- Bottom sheet for add manual / edit quantity / delete.
  [`shopping-item-sheet.component.ts:1`](../../src/app/features/shopping-list/components/shopping-item-sheet/shopping-item-sheet.component.ts#L1)

- Row checkbox, manual badge, checked strikethrough.
  [`shopping-row.component.html:1`](../../src/app/features/shopping-list/components/shopping-row/shopping-row.component.html#L1)

- Page wiring: add button, banner, sheets.
  [`shopping-list-page.component.html:1`](../../src/app/features/shopping-list/shopping-list-page.component.html#L1)

**Tests**

- Manual CRUD, coexistence, stale plan detection.
  [`database.service.shopping-list.spec.ts:224`](../../src/app/core/database/database.service.shopping-list.spec.ts#L224)
