---
title: 'Story 1.4 — Service Worker shell offline'
type: 'feature'
created: '2026-08-30'
status: 'ready-for-dev'
review_loop_iteration: 0
baseline_commit: '9259e509a987710f79c2a065a68c868a6458a798'
story_key: '1-4-service-worker-shell-offline'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-3-theme-sombre-et-shell-navigation.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After first online visit, users lose the app shell when offline — navigation and cached assets must survive network loss for NFR-8 critical paths.

**Approach:** Harden `ngsw-config.json` to prefetch shell + all lazy route chunks + PWA icons; explicitly exclude Open Food Facts API from SW caching (AR-8); add offline connectivity feedback in the shell.

## Boundaries & Constraints

**Always:**
- Production-only SW via `provideServiceWorker` (unchanged).
- Prefetch app shell JS/CSS, `index.html`, manifest, and all lazy feature chunks on install.
- Prefetch PWA icons for install/offline.
- OFF API (`world.openfoodfacts.org`) must not be persisted by the service worker (maxSize 0 dataGroup).
- French offline status message in shell when `navigator.onLine` is false.

**Ask First:**
- Caching strategies for future APIs beyond OFF.
- Enabling SW in development builds.

**Never:**
- Cache OFF responses for offline use.
- Backend or sync dependencies for offline shell.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First install online | SW activates after build | Shell assets + lazy chunks prefetched | N/A |
| Offline relaunch | `navigator.onLine === false` | Shell renders; offline banner visible | N/A |
| Tab navigation offline | User taps bottom-nav tabs | Routes change using cached chunks | N/A |
| OFF request | Any OFF URL fetch | SW dataGroup maxSize 0 — no persisted cache | Network error if offline |

</frozen-after-approval>

## Code Map

- `ngsw-config.json` — prefetch shell/icons; OFF no-cache dataGroup.
- `src/app/core/network/network-status.service.ts` — online/offline signal from window events.
- `src/app/core/layout/shell/shell.component.*` — offline banner when disconnected.
- `src/app/core/pwa/off-api-origin.ts` — shared OFF origin constant (AR-8 documentation).
- `ngsw-config.spec.ts` — validate config structure post-build expectations.
- `src/app/core/network/network-status.service.spec.ts` — online/offline events.

## Tasks & Acceptance

**Execution:**
- [ ] `ngsw-config.json` — prefetch icons; OFF dataGroup with maxSize 0.
- [ ] `network-status.service.ts` — connectivity signal.
- [ ] `shell.component` — French offline banner.
- [ ] `off-api-origin.ts` — OFF URL constant aligned with ngsw exclusion.
- [ ] `ngsw-config.spec.ts` + network service tests.

**Acceptance Criteria:**
- Given production build, when `ngsw.json` is generated, then all lazy route chunks and shell assets are in prefetch group.
- Given offline browser state, when shell loads, then offline banner appears in French.
- Given OFF API URL pattern, when inspecting ngsw config, then no persistent cache is configured (maxSize 0).
- Given normal online conditions, when app loads, then no regression to build/test pipeline.

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: `dist/nutrition/browser/ngsw.json` lists all chunks in prefetch.
- `npm test` — expected: all tests pass.
