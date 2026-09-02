---
title: 'Story 11.5 — Cache local recherches API'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '9bd333b'
story_key: '11-5-provider-search-cache'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Successful OFF / FoodRepo / USDA searches are lost when offline or when the user reopens search without repeating API calls.

**Approach:** Persist the 30 most recent online hits in IndexedDB `searchCache` (TTL 30 days). Reuse matching entries on cascade search (offline or merged with live API). Expose « Effacer historique recherche » in Paramètres.

## Boundaries & Constraints

**Always:**
- Store only OFF / FoodRepo / USDA search hits (FR-29).
- Max 30 entries; TTL 30 days; purge on read/write.
- Match on normalized display name or original query.
- Offline: show cached online sections without provider calls.
- Online: merge API hits with cache (API first, dedupe by hit id).
- Persist only after successful provider responses (`status === 'ok'`).
- Exclude `searchCache` from backup export (ephemeral cache).

**Never:**
- Pantry, meal plan, or other user entities in `searchCache`.
- Backend or cloud sync for search history.

## Code Map

- `src/app/core/models/search-cache-entry.ts` — entry + hit payload types.
- `src/app/core/food-library/search-cache.constants.ts` — max 30, TTL 30 j.
- `src/app/core/food-library/search-cache.utils.ts` — match, merge, group helpers.
- `src/app/core/food-library/search-cache.service.ts` — find / remember / clear.
- `src/app/core/database/nutrition-database.ts` — DB v10, table `searchCache`.
- `src/app/core/database/database.service.ts` — CRUD + purge + cap enforcement.
- `src/app/core/food-library/food-search-cascade.ts` — merge cached sections.
- `src/app/core/food-library/food-search.service.ts` — load cache + persist hits.
- `src/app/features/settings/settings-page.component.*` — clear history UI.

## Tasks & Acceptance

**Execution:**
- [x] IndexedDB `searchCache` table (v10) with TTL and 30-entry cap.
- [x] `SearchCacheService` + database helpers.
- [x] Cascade integration (offline cache-only, online merge).
- [x] Paramètres → « Effacer historique recherche ».
- [x] Unit tests (utils, service, cascade, food-search offline reuse).

**Acceptance Criteria:**
- Given successful OFF / FoodRepo / USDA searches, when reopening search, then matching hits appear from IndexedDB.
- Given offline, when searching with prior cache, then online sections show cached hits without API calls.
- Given Paramètres, when clearing history, then `searchCache` is empty.

## Verification

- `npm test` — search-cache, cascade, food-search specs pass.
- `npm run build` — production build succeeds.
