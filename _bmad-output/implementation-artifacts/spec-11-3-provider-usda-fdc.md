---
title: 'Story 11.3 — Provider USDA FoodData Central (Phase 3, obligatoire)'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'dfdc3fa'
story_key: '11-3-provider-usda-fdc'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** EU sources (OFF, FoodRepo) miss generic and international branded foods; users need USDA FoodData Central as fallback.

**Approach:** Add `UsdaFdcSearchProvider` with local API key in `appSettings`, parallel fetch with OFF/FoodRepo on the food library page, section 6 in cascade order; FR→EN alias table for search queries; tap → scan reference preview; IndexedDB cache of imported USDA sheets.

## Boundaries & Constraints

**Always:**
- GET read-only `api.nal.usda.gov/fdc/v1/foods/search` with `api_key` query param.
- Key stored locally in `appSettings`; excluded from backup export (NFR-21).
- Min 3 chars, debounce 400 ms (inherited from page), 5 s timeout.
- Section order: … → OFF → FoodRepo → USDA.
- Nutrient mapping: USDA 203/204/205/208/291 → kcal, P, L, G, fibres per 100 g.
- FR→EN aliases via embedded `fr-en-food-aliases.json`.
- Imported USDA hits cached in IndexedDB `usdaFoodCache` (NFR-20).
- No key → section hidden + link « Ajoutez votre clé USDA gratuite » in Paramètres.

**Never:**
- Full cascade on all surfaces (11.4).
- IndexedDB search history cache (11.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_ONLINE | key set, query ≥ 3, online | USDA section after FoodRepo with mapped hits | N/A |
| NO_KEY | no usdaApiKey | Empty section; configure link shown | N/A |
| UNAUTHORIZED | invalid key, 401/403 | Empty section; error message | Link to api-keys |
| OFFLINE | navigator offline | No USDA request | N/A |
| ALIAS | query « œuf » | API query translated to « egg » | N/A |
| TAP_HIT | user selects USDA hit | Scan reference form + cache entry stored | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/usda-fdc/usda-search.provider.ts` — new provider.
- `src/app/core/usda-fdc/usda-food-mapper.ts` — nutrient mapping.
- `src/app/core/usda-fdc/usda-query-translate.ts` — FR→EN aliases.
- `src/app/core/usda-fdc/usda-food-cache.service.ts` — IndexedDB cache (NFR-20).
- `src/assets/food-library/fr-en-food-aliases.json` — alias table.
- `src/app/core/models/app-settings.ts` — `usdaApiKey`.
- `src/app/core/database/nutrition-database.ts` — v9 `usdaFoodCache` store.
- `src/app/features/settings/components/api-keys-page/*` — USDA key + banner.
- `src/app/core/food-library/food-search.service.ts` — parallel OFF/FoodRepo/USDA.
- `src/app/core/backup/backup-export-sanitize.ts` — strip keys on export.

## Tasks & Acceptance

**Execution:**
- [x] `usda-search.provider.ts` + mapper + query translate + types + tests.
- [x] `appSettings.usdaApiKey` + `updateUsdaApiKey` + api-keys settings page banner.
- [x] `usdaFoodCache` IndexedDB table + cache on USDA hit preview.
- [x] `searchLibraryPage` parallel OFF/FoodRepo/USDA with cascade order.
- [x] Food library UI: USDA section, configure link, preview tap flow.
- [x] Backup export strips API keys.
- [x] ngsw no-cache for api.nal.usda.gov.
- [x] Attribution USDA in data-sources page.

**Acceptance Criteria:**
- Given USDA key configured and network available, when searching with debounce satisfied, then provider calls USDA `/foods/search` in parallel with OFF/FoodRepo.
- Given results, when displayed, then USDA section appears after FoodRepo (section 6).
- Given user taps a USDA hit, then scan reference form opens pre-filled and cache entry is stored.
- Given query « œuf », when searching USDA, then alias translates to « egg ».
- Given no key, when searching online, then USDA section is hidden and configure link is shown.

## Verification

**Commands:**
- `npm test` — all pass including USDA provider, mapper, cache, and searchLibraryPage specs.
