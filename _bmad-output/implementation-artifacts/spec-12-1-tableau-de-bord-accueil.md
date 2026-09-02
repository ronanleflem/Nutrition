---
title: 'Story 12.1 — Home dashboard'
type: 'feature'
created: '2026-09-02'
status: 'in-progress'
review_loop_iteration: 0
baseline_commit: '1ed8c0a315304366c9e4fbd3b1447d5f2a5c391e'
story_key: '12-1-tableau-de-bord-accueil'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-12-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cold start always lands on Garde-manger. The user hunts across five tabs for today's meals, leftover shopping, DLC alerts, and backup.

**Approach:** Add a lazy `/home` dashboard of four actionable cards. Cold start and header-title tap open it. A settings toggle can skip home on startup. Not a sixth bottom-nav tab.

## Boundaries & Constraints

**Always:**
- Cards: today's planned meals → `/plan`; remaining shopping items → `/shopping`; DLC ≤ 3 days → `/pantry?filter=expiring`; export reminder only when `shouldShowBackupReminder` → `/settings/export`.
- Each card is one tap to its surface (≤ 2 taps total from home).
- Cold start: `/home` unless `hideHomeOnStartup === true` (then `/pantry`).
- Persist `hideHomeOnStartup` and `onboardingCompleted` on `appSettings`. Add the onboarding flag for 12.2 but do not run onboarding.
- French UI, IndexedDB only, reuse existing read APIs / expiry / backup helpers.
- Home reads shopping counts via `listShoppingListItemsWithProducts` — never call `ShoppingListService.refresh()` (it can auto-regenerate).

**Ask First:**
- Adding a sixth bottom-nav tab.
- Building the 12.2 onboarding screens.

**Never:**
- Onboarding wizard (12.2) or long-press shortcuts (12.3).
- Backend, auth, cloud, new Dexie entities, Mode Courses / `ShellChromeService` changes.
- Last-tab persistence (not implemented today; do not invent it).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold start default | `hideHomeOnStartup` unset/false | Redirect `/` → `/home` | N/A |
| Hide on startup | `hideHomeOnStartup: true` | Redirect `/` → `/pantry` | N/A |
| Title tap | Any shell screen except `/home` | Header title is a link to `/home` | N/A |
| Meals card | Entries for today | Slot labels + recipe titles; tap → `/plan` | Missing recipe → title « Recette introuvable » |
| Meals empty | No entries today | Empty copy + CTA « Ouvrir le plan » → `/plan` | N/A |
| Shopping card | Unchecked items exist | Count « N articles restants »; tap → `/shopping` | N/A |
| Shopping empty | No unchecked items | Empty copy + CTA → `/shopping` | N/A |
| DLC card | Pantry items with DLC ≤ 3 days (incl. expired) | Count + names; tap → `/pantry?filter=expiring` | N/A |
| DLC empty | No expiry alerts | Card still shown with empty copy + CTA → pantry filter | N/A |
| Export card | `shouldShowBackupReminder` true | Card + CTA → `/settings/export` | N/A |
| Export hidden | Backup not stale / snoozed | Card omitted | N/A |
| Settings toggle | User checks « Masquer l'accueil au démarrage » | Persist `hideHomeOnStartup`; next `/` goes to pantry | Save error: French status |

</frozen-after-approval>

## Code Map

- `src/app/app.routes.ts` — replace static `redirectTo: 'pantry'` (L11) with a redirect function reading settings; add lazy `{ path: 'home', data: { title: 'Accueil' } }` like `/goals` (outside `BOTTOM_NAV_ITEMS`).
- `src/app/app.routes.spec.ts` — add `/home` to `lazyRoutes`; assert `/` redirect both ways.
- `src/app/core/models/app-settings.ts` — add `hideHomeOnStartup?: boolean` and `onboardingCompleted?: boolean`; defaults stay unset/false.
- `src/app/core/database/database.service.ts` — add `updateHideHomeOnStartup` mirroring `updatePreferManualOnlineSearch` (L256–264). Reads: `listMealPlanEntriesByDate` (L1389), `getRecipeDetail` (L1100), `listShoppingListItemsWithProducts` (L1522), `listPantryItemsWithProducts` (L999), `getAppSettings` (L148).
- `src/app/core/layout/shell/shell.component.html` — wrap `.shell__title` (L4) in `routerLink="/home"` when not already on `/home` (`aria-label="Accueil"`).
- `src/app/core/layout/navigation/bottom-nav-items.ts` — **read-only**: keep exactly 5 tabs.
- `src/app/core/backup/backup-reminder.ts` — **reuse** `shouldShowBackupReminder` for the export card; do not duplicate 30-day math.
- `src/app/features/meal-plan/utils/week-dates.ts` — `toLocalIsoDate` for today.
- `src/app/core/models/meal-plan-entry.ts` — `MEAL_PLAN_SLOT_LABELS`.
- `src/app/features/pantry/pantry-expiry.util.ts` — `isExpiryAlert` (≤ 3 days, includes expired).
- `src/app/features/pantry/pantry.service.ts` + `pantry-page.component.ts` — honor `?filter=expiring` via `setFilterMode('expiring')` on init.
- `src/app/features/settings/settings-page.component.*` — checkbox section; persist via DatabaseService. Toggle precedent: `data-sources-page.component.html` L70–77.
- `src/app/features/home/` — new lazy feature: `home.routes.ts`, `HomeDashboardService` (aggregate reads only), `HomePageComponent` (four cards, empty states).
- `src/app/features/products/components/empty-state/` — reuse `EmptyStateComponent` for empty cards or inline equivalent.
- Tests: follow `pantry-page.component.spec.ts` (seed Dexie + DOM) and `backup-reminder.service.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/app-settings.ts` -- add `hideHomeOnStartup` + `onboardingCompleted` -- persist flags without schema bump
- [x] `src/app/core/database/database.service.ts` -- `updateHideHomeOnStartup` -- same put-spread pattern as other settings
- [x] `src/app/app.routes.ts` -- lazy `/home` + conditional `/` redirect -- no sixth tab
- [x] `src/app/core/layout/shell/shell.component.html` + `.ts` -- title tap → `/home` -- AC logo/accueil
- [x] `src/app/features/home/` -- dashboard service + page + styles + specs -- FR-32 cards
- [x] `src/app/features/pantry/pantry-page.component.ts` -- apply `filter=expiring` query -- DLC card deep-link
- [x] `src/app/features/settings/settings-page.*` -- hide-home toggle -- AC settings option
- [x] `src/app/app.routes.spec.ts` + home/settings/pantry specs -- cover I/O matrix

**Acceptance Criteria:**
- Given cold start or tap on the header title, when the dashboard renders, then cards show today's meals, remaining shopping items, DLC ≤ 3 days, and the export reminder if applicable (FR-32).
- Given any dashboard card, when the user taps it, then the matching surface opens in one tap.
- Given Settings, when the user enables « Masquer l'accueil au démarrage », then the next cold start opens Garde-manger.
- Given the bottom nav, when the dashboard is open, then no extra tab is added and no tab is forced active.

## Spec Change Log

## Design Notes

Header title is the "logo/accueil" affordance — there is no separate logo. On `/home` keep a static `<h1>`. Shopping card must not trigger list generation. Export card uses the same stale/snooze rules as the shell banner; both may appear.

## Verification

**Commands:**
- `npm test -- --include src/app/features/home --include src/app/app.routes.spec.ts --include src/app/features/settings/settings-page.component.spec.ts --include src/app/features/pantry/pantry-page.component.spec.ts --include src/app/core/layout/shell/shell.component.spec.ts` -- expected: all pass
- `npm test` -- expected: full suite green
- `npm run build` -- expected: production build succeeds

**Manual checks:**
- Open `/` → Accueil with four card slots (export only if backup stale).
- Tap each card; confirm Plan / Courses / Garde-manger (filtre DLC) / Export.
- Toggle hide-home, reload `/` → pantry. Title tap still reaches Accueil.
