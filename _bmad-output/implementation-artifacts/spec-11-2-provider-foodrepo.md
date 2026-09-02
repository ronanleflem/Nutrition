---
title: 'Story 11.2 — Provider FoodRepo (Phase 2, complément marques)'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '64f34ab'
story_key: '11-2-provider-foodrepo'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Some branded products are missing from OFF; users need a complementary online source (FoodRepo, especially CH/EU).

**Approach:** Add `FoodRepoSearchProvider` with local API key in `appSettings`, parallel fetch with OFF on the food library page, section 5 in cascade order; tap → scan reference preview with barcode when present.

## Boundaries & Constraints

**Always:**
- POST read-only `foodrepo.org/api/v3/products/_search` with `Authorization: Token token="…"`.
- Key stored locally in `appSettings`; excluded from backup export (NFR-21).
- Min 3 chars, debounce 400 ms (inherited from page), 5 s timeout.
- Section order: … → OFF → FoodRepo.
- No key → section hidden + link to Paramètres.

**Never:**
- USDA provider (11.3).
- Full cascade on all surfaces (11.4).
- IndexedDB search cache (11.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_ONLINE | key set, query ≥ 3, online | FoodRepo section after OFF with mapped hits | N/A |
| NO_KEY | no foodRepoApiKey | Empty section; configure link shown | N/A |
| UNAUTHORIZED | invalid key, 401 | Empty section; error message | Link to api-keys |
| OFFLINE | navigator offline | No FoodRepo request | N/A |
| TAP_HIT | user selects FoodRepo hit | Scan reference form with barcode prefill | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/foodrepo-api/foodrepo-search.provider.ts` — new provider.
- `src/app/core/models/app-settings.ts` — `foodRepoApiKey`.
- `src/app/core/database/database.service.ts` — `updateFoodRepoApiKey`.
- `src/app/features/settings/components/api-keys-page/*` — key configuration UI.
- `src/app/core/food-library/food-search.service.ts` — parallel OFF + FoodRepo in `searchLibraryPage`.
- `src/app/core/backup/backup-export-sanitize.ts` — strip keys on export.

## Tasks & Acceptance

**Execution:**
- [x] `foodrepo-search.provider.ts` + mapper + types + tests.
- [x] `appSettings.foodRepoApiKey` + `updateFoodRepoApiKey` + api-keys settings page.
- [x] `searchLibraryPage` parallel OFF/FoodRepo with cascade order.
- [x] Food library UI: FoodRepo section, configure link, preview tap flow.
- [x] Backup export strips API keys.
- [x] ngsw no-cache for foodrepo.org.

**Acceptance Criteria:**
- Given FoodRepo key configured and network available, when searching with debounce satisfied, then provider calls FoodRepo `_search` in parallel with OFF.
- Given results, when displayed, then FoodRepo section appears after OFF.
- Given user taps a FoodRepo hit with barcode, then scan reference form opens pre-filled.
- Given no key, when searching online, then FoodRepo section is hidden and configure link is shown.

## Verification

**Commands:**
- `npm test` — all pass including FoodRepo provider and searchLibraryPage specs.
