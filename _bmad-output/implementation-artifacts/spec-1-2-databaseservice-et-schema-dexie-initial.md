---
title: 'Story 1.2 — DatabaseService et schéma Dexie initial'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'f3d1e4b693ca3f1f7598b32ca270462c38af6b5f'
story_key: '1-2-databaseservice-et-schéma-dexie-initial'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-1-scaffold-angular-pwa-et-routing-lazy.md'
  - '{project-root}/_bmad-output/specs/spec-nutrition/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Angular shell has no local persistence. User settings cannot survive reloads, and later features have no IndexedDB gateway.

**Approach:** Add Dexie 4.4.5 behind a singleton `DatabaseService` in `core/database/`, seed `appSettings` with `theme: 'dark'` on first launch, and initialize the database at app bootstrap before routing.

## Boundaries & Constraints

**Always:**
- Dexie pinned to 4.4.5; only `core/database/` imports `dexie`.
- `DatabaseService` is the sole public DB API for features (AR-2).
- Table `appSettings` with singleton id `singleton`, default `theme: 'dark'` (AR-12).
- DB name `NutritionDb`, schema version `1`, stores `{ appSettings: 'id' }`.
- Initialize via `provideAppInitializer` before app renders routes.

**Ask First:**
- Adding MVP tables beyond `appSettings` in this story.
- Changing singleton id or default theme.

**Never:**
- Importing Dexie in `features/*`.
- Network calls for persistence.
- Shell navigation or theme application in UI (story 1.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First launch | Empty IndexedDB | `appSettings` row `{ id: 'singleton', theme: 'dark' }` created | N/A |
| Subsequent launch | Existing `appSettings` | Same row returned unchanged | N/A |
| Re-init | `initialize()` called twice | Idempotent; no duplicate rows | N/A |
| Missing singleton after init | Corrupt DB (test only) | `getAppSettings()` throws domain error | Explicit Error |

</frozen-after-approval>

## Code Map

- `package.json` — add `dexie@4.4.5`, dev `fake-indexeddb` for unit tests.
- `src/app/core/models/app-settings.ts` — `AppSettings` interface, singleton id constant, default factory.
- `src/app/core/database/nutrition-database.ts` — internal Dexie subclass (not exported to features).
- `src/app/core/database/database.service.ts` — `initialize()`, `getAppSettings()`; owns NutritionDatabase instance.
- `src/app/core/database/database.service.spec.ts` — fake-indexeddb tests for seed + persistence.
- `src/app/app.config.ts` — `provideAppInitializer` calling `DatabaseService.initialize()`.
- Story 1.1 continuity: `src/app/features/*` remain Dexie-free; `app.routes.ts` unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` — add dexie 4.4.5 and fake-indexeddb dev dependency.
- [x] `src/app/core/models/app-settings.ts` — AppSettings model + defaults.
- [x] `src/app/core/database/nutrition-database.ts` — Dexie schema v1 with appSettings store.
- [x] `src/app/core/database/database.service.ts` — init, seed, getAppSettings.
- [x] `src/app/app.config.ts` — bootstrap initializer.
- [x] `src/app/core/database/database.service.spec.ts` — unit tests covering I/O matrix.

**Acceptance Criteria:**
- Given first app start, when Dexie initializes via DatabaseService, then `appSettings` exists with `theme: 'dark'`.
- Given a prior session, when the app reloads, then `appSettings` is read from IndexedDB without network.
- Given any feature module, when imports are checked, then none import `dexie` directly.

## Spec Change Log

## Verification

**Commands:**
- `npm install` — expected: dexie installed.
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass including DatabaseService specs.
