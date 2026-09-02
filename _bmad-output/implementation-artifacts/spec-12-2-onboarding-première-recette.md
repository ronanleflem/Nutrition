---
title: 'Story 12.2 — First-recipe onboarding'
type: 'feature'
created: '2026-09-02'
status: 'in-progress'
review_loop_iteration: 0
baseline_commit: 'a2013eb97be3aa5552e7df38540f08db40abfaee'
story_key: '12-2-onboarding-première-recette'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-12-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-12-1-tableau-de-bord-accueil.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A new user can open Accueil but still has no recipe, so the app does not deliver value on first run.

**Approach:** A 3-step `/onboarding` wizard (macros optional → Ciqual starter pack or library → real « Omelette » recipe). First cold start opens it until `onboardingCompleted` is true. Relaunchable from Settings.

## Boundaries & Constraints

**Always:**
- Steps: (1) optional macro goals, Skip allowed with no write; (2) `FoodLibraryImportService.importStarterPack()` or a link to `/products/library`; (3) create a real `Recipe` + first variant — suggested template « Omelette » with pack/library ingredients (œuf, beurre, sel).
- Skip only on step 1. Steps 2–3 must complete (pack import or library visit, then a created recipe).
- Persist `onboardingCompleted: true` only after step 3 succeeds; then navigate `/home`.
- Cold start: if `onboardingCompleted !== true` → `/onboarding`; else keep 12.1 (`hideHomeOnStartup` → pantry, otherwise home).
- Settings: « Relancer le guidage recette » opens `/onboarding` without clearing the flag (abandon must not trap the next `/`).
- French UI, IndexedDB only. Reuse Epic 5 / 10 / 4 APIs — do not duplicate pack IDs or recipe validation.
- Hide bottom nav during `/onboarding` via `ShellChromeService` and restore on destroy.

**Ask First:**
- Changing the 3-step order or adding a global « Passer tout le guidage ».
- Building 12.3 long-press shortcuts.

**Never:**
- Fake tutorial recipe that is not a `Recipe` row.
- Manual macro typing for omelette ingredients.
- Backend, auth, cloud, new Dexie entities, Mode Courses behavior changes.
- Calling `ShoppingListService.refresh()` from onboarding.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold start incomplete | `onboardingCompleted` unset | `/` → `/onboarding` step 1 | Settings read fail → `/home` (12.1 fallback) |
| Cold start done | `onboardingCompleted: true` | Existing 12.1 home/pantry redirect | N/A |
| Step 1 skip | User taps « Passer » | Advance to step 2; no macro write | N/A |
| Step 1 save | Valid kcal/P/L/G/fibres | `MacroGoalsService.save`; then step 2 | French error; stay on step 1 |
| Step 2 pack | User taps pack CTA | `importStarterPack()`; show « X ajoutés, Y déjà présents »; Continuer enabled | French error; stay on step 2 |
| Step 2 library | User taps « Parcourir la bibliothèque » | Open `/products/library`; Continuer enabled on return | N/A |
| Step 2 blocked | Neither pack nor library | Continuer disabled | N/A |
| Step 3 omelette | Pack/library products exist or importable | Create Recipe title « Omelette », variant Base, œuf + beurre + sel; flag true; `/home` | Missing hit: import those 3 Ciqual ids; else French error |
| Step 3 custom | User taps « Créer une autre recette » | `/recipes/new?from=onboarding`; on successful create (same session) set flag + `/home` | If they leave without saving, flag stays false |
| Relaunch | Settings button | `/onboarding` step 1; flag unchanged until step 3 succeeds again | N/A |
| Pack idempotent | Pack already imported | Summary `added: 0`, alreadyPresent > 0; Continuer OK | N/A |

</frozen-after-approval>

## Code Map

- `src/app/app.routes.ts` — extend `resolveStartupPath` (L8–16): `onboardingCompleted !== true` → `'onboarding'` before hide-home; add lazy `{ path: 'onboarding', data: { title: 'Bienvenue' } }`.
- `src/app/app.routes.spec.ts` — assert `/` → `/onboarding` when flag unset; `/` → `/home` when completed and hide-home false.
- `src/app/core/models/app-settings.ts` — `onboardingCompleted` already exists (L19–20).
- `src/app/core/database/database.service.ts` — add `updateOnboardingCompleted` mirroring `updateHideHomeOnStartup` (L266–274).
- `src/app/core/layout/shell-chrome.service.ts` — hide chrome on onboarding enter, restore on destroy (same as store mode L7–9).
- `src/app/features/macro-goals/services/macro-goals.service.ts` — `save()` L7–32 for step 1. Form fields: kcal, proteinG, fatG, carbsG, fiberG (`macro-goals-page.component.html`).
- `src/app/core/food-library/food-library-import.service.ts` — `importStarterPack()` L53–83; `StarterPackImportSummary` L13–18. Label: `FOOD_LIBRARY_STARTER_PACK_LABEL` in `food-library-starter-pack.ts` L7. Omelette ids: `ciqual-22000`, `ciqual-16400`, `ciqual-11058`.
- `src/app/features/products/products.routes.ts` — `/products/library` for step 2 browse.
- `src/app/features/recipes/services/recipes.service.ts` — `createRecipeWithFirstVariant` L37–42. Prefill `/recipes/new` already exists (`recipes.routes.ts` L11).
- `src/app/core/database/database.service.ts` — `listProductCatalog` to resolve `sourceId` → productId after pack import.
- `src/app/features/settings/settings-page.component.*` — Accueil section: add relaunch control next to hide-home (HTML L14–31).
- `src/app/features/onboarding/` — new lazy feature: routes, wizard page (3 steps), small service for step state + omelette create.
- Tests: `food-library-import.service.spec.ts` (pack idempotency), `settings-page.component.spec.ts`, `app.routes.spec.ts`, `database.service.recipes.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/database/database.service.ts` -- `updateOnboardingCompleted` -- persist flag without schema bump
- [x] `src/app/app.routes.ts` -- lazy `/onboarding` + startup order -- first open = wizard
- [x] `src/app/features/onboarding/` -- 3-step wizard + omelette create + specs -- FR-33
- [x] `src/app/features/settings/settings-page.*` -- relaunch button -- AC relançable
- [x] `src/app/app.routes.spec.ts` + settings/db specs -- cover I/O matrix

**Acceptance Criteria:**
- Given first open (`onboardingCompleted` false), when the app starts, then the 3-step wizard runs (macros skippable; pack or library; real recipe).
- Given step 3 succeeds with the Omelette template (or a saved custom recipe), when the wizard finishes, then `onboardingCompleted` is true and Accueil opens.
- Given Settings, when the user taps « Relancer le guidage recette », then the wizard opens again.

## Spec Change Log

## Design Notes

Omelette quantities (indicative, 1 portion): œuf 120 g, beurre 10 g, sel 1 g. Import the three Ciqual hits if missing so step 3 works after a library-only step 2. Custom path: listen to `RecipesService` create from `/recipes/new` only when `from=onboarding` query is present.

Do not hide chrome if restore on destroy is uncertain — prefer hiding and restoring in `ngOnInit`/`ngOnDestroy`.

## Verification

**Commands:**
- `npm test -- --include src/app/features/onboarding --include src/app/app.routes.spec.ts --include src/app/features/settings/settings-page.component.spec.ts --include src/app/core/database/database.service.spec.ts` -- expected: all pass
- `npm test` -- expected: full suite green
- `npm run build` -- expected: production build succeeds

**Manual checks:**
- Fresh profile `/` → wizard step 1; Passer → pack import → Omelette → Accueil.
- Settings relaunch opens wizard; `/` still goes to Accueil if they abandon.
