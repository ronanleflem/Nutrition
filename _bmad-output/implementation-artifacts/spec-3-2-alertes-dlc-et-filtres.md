---
title: 'Story 3.2 — Alertes DLC et filtres'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '5ed22de'
story_key: '3-2-alertes-dlc-et-filtres'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-1-crud-garde-manger.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pantry lines show DLC as plain text with no visual urgency; users cannot sort or filter stock by expiry or name.

**Approach:** Add local-day expiry helpers, `accent-warning` badges for DLC ≤ 3 days, and in-page sort (name / DLC) plus filter (all / expiring soon) with contextual empty states.

## Boundaries & Constraints

**Always:**
- Alert only when `expiryDate` is set and DLC is within ≤ 3 calendar days (includes today and expired).
- No alert badge when DLC is absent.
- Badge color `#E8B86D` via `--color-accent-warning`.
- Sort modes: name A–Z, DLC soonest-first (items without DLC last).
- Filter modes: all, expiring soon (≤ 3 days with DLC).
- French UI labels; offline-only.

**Ask First:**
- Pull-to-refresh on pantry list.
- DLC badges on other surfaces.

**Never:**
- Network calls.
- Changing pantry CRUD rules from story 3.1.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DLC in 3 days | expiryDate = today+3 | `isExpiryAlert` true, badge shown | N/A |
| DLC in 4 days | expiryDate = today+4 | No badge | N/A |
| No DLC | expiryDate undefined | No badge; sort puts item after dated items | N/A |
| Expired DLC | expiryDate = yesterday | Alert true, badge « expirée » | N/A |
| Filter expiring | Mix of items | Only ≤3-day lines shown | N/A |
| Filter empty | All items outside window | Filtered empty state, not global empty | N/A |
| Sort by name | Various names | Locale `fr` A–Z order | N/A |
| Sort by DLC | Mixed dates | Soonest first; undated last | N/A |

</frozen-after-approval>

## Code Map

- `src/styles/_tokens.scss` — `--color-accent-warning: #e8b86d`.
- `src/app/features/pantry/pantry-expiry.util.ts` — day diff, alert predicate, badge label.
- `src/app/features/pantry/pantry-list.util.ts` — sort/filter pure functions.
- `src/app/features/pantry/pantry.service.ts` — `sortMode`, `filterMode`, `displayItems` signal.
- `src/app/features/pantry/pantry-page.component.ts` — controls + badge rendering.
- `src/app/features/pantry/pantry-page.component.html` — filter bar, badges, empty states.
- `src/app/features/pantry/pantry-expiry.util.spec.ts` — matrix tests for expiry helpers.
- `src/app/features/pantry/pantry-list.util.spec.ts` — sort/filter tests.
- `src/app/features/pantry/pantry-page.component.spec.ts` — badge and filter UI tests.

## Tasks & Acceptance

**Execution:**
- [ ] `src/styles/_tokens.scss` — accent-warning token.
- [ ] `src/app/features/pantry/pantry-expiry.util.ts` — expiry helpers.
- [ ] `src/app/features/pantry/pantry-list.util.ts` — sort and filter.
- [ ] `src/app/features/pantry/pantry.service.ts` — view state + displayItems.
- [ ] `src/app/features/pantry/pantry-page.component.ts` — UI wiring.
- [ ] `src/app/features/pantry/pantry-page.component.html` — badges, controls, empty states.
- [ ] `src/app/features/pantry/pantry-expiry.util.spec.ts` — unit tests.
- [ ] `src/app/features/pantry/pantry-list.util.spec.ts` — unit tests.
- [ ] `src/app/features/pantry/pantry-page.component.spec.ts` — component tests.

**Acceptance Criteria:**
- Given a pantry line with DLC in ≤ 3 days, when the list renders, then a warning badge is shown.
- Given a line without DLC, when the list renders, then no expiry alert is shown.
- Given stock exists, when I sort or filter, then the list updates without network calls.
- Given a filtered view with no matches, when rendered, then a contextual EmptyState appears.

## Spec Change Log

## Verification

**Commands:**
- `npm test` — expected: all tests pass including new pantry expiry/list specs.
- `npm run build` — expected: success.

**Manual checks:**
- Add items with DLC today+2 and today+10; badge only on near item; filter « DLC proche » shows one row.
