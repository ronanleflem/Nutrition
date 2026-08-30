---
title: 'Story 1.3 — Thème sombre et shell navigation'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: '383ac20a01ce52c4eef2393788ea3a7bfe33eaaa'
story_key: '1-3-thème-sombre-et-shell-navigation'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-2-databaseservice-et-schema-dexie-initial.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app renders bare placeholders without the dark mobile shell or bottom navigation required for in-store use.

**Approach:** Add a `ShellComponent` with header (title + settings gear), bottom nav (5 French tabs), and global design tokens from DESIGN.md; apply `theme: dark` from `DatabaseService` at bootstrap.

## Boundaries & Constraints

**Always:**
- Surface base `#121212`, ink primary `#F5F5F5` (contrast ≥ 4.5:1).
- Bottom nav: Garde-manger, Produits, Recettes, Plan, Courses — routes `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`.
- Settings gear (`aria-label="Paramètres"`) links to `/settings` on every shell screen; touch target ≥ 44px.
- All shell UI text in French.
- Layout lives in `core/layout/`; features stay presentation-light (no nav duplication).

**Ask First:**
- Adding Material Icons or external icon font.
- Hiding bottom nav on specific routes.

**Never:**
- Light theme as default.
- Settings tab in bottom nav (gear only per UX-DR1).
- Service worker offline changes (story 1.4).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First open | Default appSettings | `data-theme="dark"` on document; background #121212 | N/A |
| Bottom nav tap | User taps « Produits » | Navigate to `/products`; active tab highlighted | N/A |
| Settings gear | User taps gear on any screen | Navigate to `/settings` | N/A |
| Route title | Navigate to `/plan` | Header shows « Plan » | N/A |
| Goals route | Navigate to `/goals` | Shell visible; no bottom-nav tab active | N/A |

</frozen-after-approval>

## Code Map

- `src/styles/_tokens.scss` — CSS custom properties from DESIGN.md.
- `src/styles.scss` — global reset, body theme, reduced-motion.
- `src/app/core/layout/theme/theme.service.ts` — read appSettings, set `data-theme`.
- `src/app/core/layout/navigation/bottom-nav-items.ts` — 5 tab config (path, label).
- `src/app/core/layout/bottom-nav/bottom-nav.component.ts` — nav bar with RouterLinkActive.
- `src/app/core/layout/shell/shell.component.ts` — header + outlet + bottom nav.
- `src/app/app.routes.ts` — wrap feature routes under ShellComponent with `data.title`.
- `src/app/app.config.ts` — extend initializer to apply theme after DB init.
- Feature placeholder pages — remove duplicate `<h1>` (title in shell header).

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/_tokens.scss` + `styles.scss` — dark theme tokens and base styles.
- [x] `theme.service.ts` — apply theme from DatabaseService.
- [x] `shell.component.ts` + `bottom-nav.component.ts` — layout shell.
- [x] `app.routes.ts` — shell parent route with title data.
- [x] `app.config.ts` — theme bootstrap.
- [x] Component tests for shell nav labels and settings link.

**Acceptance Criteria:**
- Given first open, when shell renders, then background is #121212 and text meets contrast requirements.
- Given shell, when bottom nav is visible, then 5 French tab labels are shown and link to correct routes.
- Given any shell screen, when user taps settings gear, then `/settings` opens.
- Given any main surface, when counting taps from home, then reachable in ≤ 2 taps via bottom nav or gear.

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: success.
- `npm test` — expected: all tests pass.
