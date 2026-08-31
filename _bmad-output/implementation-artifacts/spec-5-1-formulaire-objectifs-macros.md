---
title: 'Story 5.1 — Formulaire objectifs macros'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '1b3e4fbb8e64171843ca2c2686bc30003a5a4dde'
story_key: '5-1-formulaire-objectifs-macros'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-3-calcul-macros-par-portion.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The `/goals` route is a placeholder; users cannot persist daily macro targets, blocking future plan-vs-goals synthesis (Story 5.2).

**Approach:** Add Dexie v7 `macroGoals` singleton store, `DatabaseService` get/update APIs, and a French reactive form on `MacroGoalsPageComponent` with navigation links from Plan and Settings.

## Boundaries & Constraints

**Always:**
- Singleton id `MACRO_GOALS_SINGLETON_ID = 'singleton'` (mirror `appSettings`).
- Optional fields: `kcal?`, `proteinG?`, `fatG?`, `carbsG?`, `fiberG?` — empty input clears the field (not tracked).
- Gram labels explicit for P/L/G/fiber: « Protéines (g) », etc.; kcal without « g ».
- Values ≥ 0 when provided; reject negative on submit.
- Features access Dexie only through `DatabaseService`.
- UI text in French; touch targets ≥ 44px.

**Ask First:**
- Daily macro synthesis bars (Story 5.2).
- Import/export merge rules (Epic 8).

**Never:**
- Network calls for goals persistence.
- Bottom-nav tab for goals.
- Meal plan aggregation logic in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load | No macroGoals row | Seed empty singleton; form shows blank fields | N/A |
| Save partial goals | kcal=2000, proteinG=120, others empty | Persist only kcal + proteinG; other fields absent | N/A |
| Clear field | Existing proteinG=120, user clears field and saves | proteinG removed from stored record | N/A |
| Negative value | proteinG=-5 | Save blocked | Inline French validation |
| Reload | Saved goals exist | Form prefilled with stored values | N/A |
| Nav from Plan | User on `/plan` | Link to `/goals` visible and works | N/A |
| Nav from Settings | User on `/settings` | Link to `/goals` visible and works | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/models/macro-goals.ts` — `MacroGoals`, singleton id, `createDefaultMacroGoals()`, `UpdateMacroGoalsInput`.
- `src/app/core/database/nutrition-database.ts` — bump to v7; add `macroGoals: 'id'` store and typed table.
- `src/app/core/database/database.service.ts` — `getMacroGoals()`, `updateMacroGoals()`; seed in `openAndSeed()`.
- `src/app/core/database/database.service.macro-goals.spec.ts` — matrix coverage tests.
- `src/app/features/macro-goals/services/macro-goals.service.ts` — load/save wrapper with signals.
- `src/app/features/macro-goals/macro-goals-page.component.ts/html/scss` — reactive form (pattern: `reference-form-page` macro fieldset).
- `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — add nav link « Objectifs » → `/goals`.
- `src/app/features/settings/settings-page.component.html` — add nav link « Objectifs macros » → `/goals`.
- `src/app/app.routes.spec.ts` — update `/goals` expected text.
- Reuse: `reference-form-page` SCSS patterns for numeric macro inputs; `app-settings.ts` singleton pattern.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/macro-goals.ts` — model and types.
- [x] `src/app/core/database/nutrition-database.ts` — Dexie v7 migration.
- [x] `src/app/core/database/database.service.ts` — macro goals APIs + seed.
- [x] `src/app/core/database/database.service.macro-goals.spec.ts` — I/O matrix tests.
- [x] `src/app/features/macro-goals/services/macro-goals.service.ts` — feature service.
- [x] `src/app/features/macro-goals/macro-goals-page.component.ts/html/scss` — goals form UI.
- [x] `src/app/features/meal-plan/meal-plan-page.component.ts/html/scss` — Plan → goals link.
- [x] `src/app/features/settings/settings-page.component.html` — Settings → goals link.
- [x] `src/app/app.routes.spec.ts` — update lazy route assertion.

**Acceptance Criteria:**
- Given `/goals`, when I enter kcal and macro grams and save, then values persist in IndexedDB `macroGoals` singleton.
- Given empty fields, when I save, then those nutrients are not stored (optional goals).
- Given gram macro fields, when displayed, then labels show explicit « g » unit.
- Given `/plan` or `/settings`, when I follow the Objectifs link, then I reach `/goals`.

## Verification

**Commands:**
- `npm test` — expected: all tests pass including `database.service.macro-goals.spec.ts`.
- `npm run build` — expected: production build succeeds with Dexie v7 migration.

**Manual checks:**
- Open `/goals`, set kcal=2000 and protein=120g, save, reload — values restored.
- Clear protein, save, reload — protein field empty, kcal still 2000.
- From `/plan` and `/settings`, link navigates to `/goals`.
