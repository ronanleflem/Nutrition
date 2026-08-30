---
title: 'Story 1.1 — Scaffold Angular PWA et routing lazy'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'ff728027cb6829eba078ed0d7e068ee70f80d679'
story_key: '1-1-scaffold-angular-pwa-et-routing-lazy'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has planning artifacts but no runnable Angular application. Without a PWA scaffold and lazy feature routes, no subsequent epic story can be implemented or verified.

**Approach:** Bootstrap an Angular 22.1.4 standalone PWA at the repo root with `@angular/service-worker`, a valid web manifest (Nutrition, icons, `display: standalone`), and lazy-loaded placeholder routes for all seven feature surfaces.

## Boundaries & Constraints

**Always:**
- Angular 22.1.4, standalone components, npm, French UI strings on placeholders.
- Lazy routes: `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`, `/goals`, `/settings`.
- Feature folders under `src/app/features/` matching architecture spine (AR-16).
- PWA via `@angular/service-worker` — no external starter template (AR-1).
- No backend, no Dexie, no shell navigation in this story (stories 1.2–1.3).

**Ask First:**
- Changing Angular major/minor version from 22.1.4.
- Placing the app in a subdirectory instead of repo root.

**Never:**
- Firebase, Supabase, or any cloud sync/auth.
- Implementing DatabaseService, theme shell, or bottom nav (later stories).
- Committing user data exports.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dev server start | `npm start` in repo root | App compiles and serves without errors | Build errors fail CI/local verify |
| Default route | Navigate to `/` | Redirect to `/pantry` | N/A |
| Lazy route load | Navigate to each feature path | Placeholder component renders with French label | 404 for unknown paths |
| PWA manifest | Inspect `manifest.webmanifest` | `name`/`short_name` Nutrition, `display: standalone`, icons present | N/A |

</frozen-after-approval>

## Code Map

- `package.json` — create; pin `@angular/*` to 22.1.4, add `@angular/service-worker`.
- `angular.json` — Angular CLI workspace config with PWA assets.
- `src/main.ts` — bootstrap `App` with router and service worker provider (prod).
- `src/app/app.config.ts` — `provideRouter`, `provideServiceWorker` when production.
- `src/app/app.routes.ts` — root redirects + lazy `loadChildren` for seven features.
- `src/app/features/pantry/pantry.routes.ts` — lazy route + placeholder component.
- `src/app/features/products/products.routes.ts` — same pattern.
- `src/app/features/recipes/recipes.routes.ts` — same pattern.
- `src/app/features/meal-plan/meal-plan.routes.ts` — route path `/plan`.
- `src/app/features/shopping-list/shopping-list.routes.ts` — route path `/shopping`.
- `src/app/features/macro-goals/macro-goals.routes.ts` — route path `/goals`.
- `src/app/features/settings/settings.routes.ts` — route path `/settings`.
- `public/manifest.webmanifest` — PWA manifest (Nutrition, standalone, icons).
- `public/icons/` — PWA icon assets referenced by manifest.
- `ngsw-config.json` — service worker asset groups (shell prefetch).
- `README.md` — add `npm install` / `npm start` instructions (existing BMAD section preserved).

## Tasks & Acceptance

**Execution:**
- [x] `package.json` — scaffold Angular 22.1.4 workspace with routing, SCSS, standalone defaults.
- [x] `public/manifest.webmanifest` — valid PWA manifest for Nutrition.
- [x] `src/app/app.routes.ts` — lazy routes for all seven feature paths with `/` → `/pantry` redirect.
- [x] `src/app/features/*` — placeholder standalone components (French title per surface).
- [x] `ngsw-config.json` + `app.config.ts` — register `@angular/service-worker`.
- [x] `README.md` — document dev commands for the Angular app.

**Acceptance Criteria:**
- Given a fresh clone, when I run `npm install && npm start`, then the application starts without compile errors.
- Given the running app, when I open `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`, `/goals`, `/settings`, then each lazy placeholder renders.
- Given `public/manifest.webmanifest`, when inspected, then name is Nutrition, display is standalone, and icons are defined.
- Given production build, when service worker is enabled, then `ngsw-config.json` prefetches app shell assets.

## Spec Change Log

## Verification

**Commands:**
- `npm install` — expected: clean install, no errors.
- `npm run build` — expected: production build succeeds, `dist/` contains manifest and ngsw files.
- `npm start` — expected: dev server starts (smoke; may run in background).

**Manual checks (if no CLI):**
- Open `http://localhost:4200/pantry` and confirm French placeholder text.
