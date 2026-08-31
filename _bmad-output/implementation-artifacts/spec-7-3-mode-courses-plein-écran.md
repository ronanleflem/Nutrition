---
title: 'Story 7.3 — Mode Courses plein écran'
type: 'feature'
created: '2026-08-31'
status: 'in-progress'
review_loop_iteration: 0
baseline_commit: '4712f98'
story_key: '7-3-mode-courses-plein-écran'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/mockups/shopping-mode.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot shop efficiently in-store: normal list UI keeps shell chrome, small touch targets, and edit affordances that distract from checking items.

**Approach:** Add « Mode Courses » full-screen view hiding shell header and bottom nav, with `StoreModeHeader` (remaining counter + Terminer), store-mode `ShoppingRow` (52px tap zone, toggle only), unchecked items first.

## Boundaries & Constraints

**Always:**
- Enter via « Mode Courses » button when list has items.
- Hide shell header and bottom nav via `ShellChromeService`.
- Header: « Terminer » (exit), title « Courses », counter « X restants » (unchecked count).
- Row min-height 52px; tap toggles `checked`; instant opacity + strikethrough, no animation.
- Unchecked items listed before checked.
- Checked states persist in IndexedDB (existing toggle).
- Offline-capable (local only).

**Ask First:** None.

**Never:**
- Edit/delete/regenerate in store mode.
- Animations, toasts, swipe-to-delete in store mode.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Enter store mode | List with items | Full screen, chrome hidden | Button hidden if empty |
| Toggle item | Tap row/check zone | checked flipped, visual feedback | N/A |
| Remaining counter | 3 unchecked | Shows « 3 restants » | N/A |
| All checked | 0 unchecked | Shows « 0 restant » | N/A |
| Terminer | User taps | Exit store mode, chrome restored, states kept | N/A |
| Leave route | Navigate away while active | Chrome restored (ngOnDestroy) | N/A |
| Sort order | Mixed checked | Unchecked first, then checked | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/layout/shell-chrome.service.ts` — `hidden` signal for chrome suppression.
- `src/app/core/layout/shell/shell.component.ts/html/scss` — conditional header/nav.
- `src/app/features/shopping-list/services/shopping-list.service.ts` — `storeModeItems`, `remainingCount`.
- `src/app/features/shopping-list/components/store-mode-view/` — fullscreen store UI.
- `src/app/features/shopping-list/components/shopping-row/` — `storeMode` input, 52px targets.
- `src/app/features/shopping-list/shopping-list-page.component.*` — Mode Courses button + toggle view.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/layout/shell-chrome.service.ts` — chrome hide signal.
- [x] `src/app/core/layout/shell/shell.component.*` — hide header + bottom nav.
- [x] `src/app/features/shopping-list/services/shopping-list.service.ts` — store mode computed.
- [x] `src/app/features/shopping-list/components/store-mode-view/` — fullscreen view.
- [x] `src/app/features/shopping-list/components/shopping-row/` — store mode styling/behavior.
- [x] `src/app/features/shopping-list/shopping-list-page.component.*` — wire mode toggle.
- [x] Tests for chrome service, store sort, shell hide.

**Acceptance Criteria:**
- Given a non-empty list, when I tap « Mode Courses », then shell header and bottom nav are hidden.
- Given store mode, when I tap a row, then the item toggles checked with instant visual feedback.
- Given store mode header, then it shows « X restants » and a « Terminer » button.
- Given I tap Terminer, then I return to the normal list with checked states preserved.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build` — succeeds.

**Manual checks:**
- Enter store mode on `/shopping`, check items, Terminer — states persist.

## Spec Change Log

## Design Notes

Store mode is in-page overlay state, not a separate route. `ShellChromeService` is reusable for future immersive views.
