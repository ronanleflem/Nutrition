---
title: 'Story 11.1 — Provider OFF Search-a-licious (Phase 2)'
type: 'feature'
created: '2026-09-02'
status: 'in-progress'
review_loop_iteration: 0
baseline_commit: '64f34ab'
story_key: '11-1-provider-off-search-a-licious'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot find French branded products (e.g. « skyr danone ») by name online; only barcode scan via OFF v2 API exists today.

**Approach:** Add `OffSearchProvider` calling Search-a-licious with FR bias, rate limiting and debounce guards; wire first consumer on the food library page with OFF section after offline libraries; OFF hit opens the existing scan reference preview flow.

## Boundaries & Constraints

**Always:**
- GET read-only `search.openfoodfacts.org/search?q=…&langs=fr` (FR-28).
- ≤ 10 req/min (NFR-19); debounce ≥ 400 ms; min 3 characters (NFR-15).
- 5 s timeout; no personal data sent.
- OFF tap → `ScanService` reference form (same as barcode found).
- Offline: OFF section hidden + message with offline library emphasis (NFR-15).

**Never:**
- FoodRepo / USDA providers (11.2–11.3).
- Full cascade on all surfaces (11.4).
- IndexedDB search cache (11.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_ONLINE | query ≥ 3 chars, online, under rate limit | OFF section with mapped hits (barcode, name, brand, macros) | N/A |
| TOO_SHORT | query < 3 chars | No OFF request; empty OFF section | N/A |
| OFFLINE | navigator offline | OFF section hidden; offline message shown | N/A |
| RATE_LIMIT | 11th request within 60 s | No fetch; `rate_limited` status | UI shows retry hint |
| NETWORK_ERROR | fetch fails / timeout | Empty hits; `network_error` status | Non-blocking; offline sections still shown |
| TAP_HIT | user selects OFF hit | Navigate to scan reference with OFF prefill | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/off-api/off-api.service.ts` — existing barcode lookup + nutriments mapping to reuse.
- `src/app/core/off-api/off-product-prefill.ts` — shared prefill shape for scan reference form.
- `src/app/features/products/services/scan.service.ts` — barcode resolve + `openReferenceForm`; extend for OFF search selection.
- `src/app/core/food-library/food-search.service.ts` — local search; extend with OFF online section merge.
- `src/app/features/products/components/food-library-page/*` — search UI; add OFF section + offline banner.
- `src/app/core/pwa/off-api-origin.ts` — existing OFF origin constant pattern for ngsw.
- `ngsw-config.json` — add search.openfoodfacts.org no-cache dataGroup.

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/core/off-api/off-product-mapper.ts` — extract shared OFF nutriments/name mapping from `off-api.service.ts`.
- [ ] `src/app/core/off-api/off-search-origin.ts` — Search-a-licious origin constant.
- [ ] `src/app/core/off-api/off-search-rate-limiter.ts` — 10 req/min sliding window.
- [ ] `src/app/core/off-api/off-search.types.ts` — provider result + hit types.
- [ ] `src/app/core/off-api/off-search.provider.ts` — `OffSearchProvider.search()` with guards, timeout, mapping.
- [ ] `src/app/core/off-api/off-search.provider.spec.ts` — matrix coverage + rate limit tests.
- [ ] `src/app/core/off-api/off-api.service.ts` — use shared mapper.
- [ ] `src/app/core/food-library/food-library-search.types.ts` — union types for offline + OFF sections.
- [ ] `src/app/core/food-library/food-search.service.ts` — `searchLibraryPage()` merging local + OFF.
- [ ] `src/app/features/products/services/scan.service.ts` — `openFromOffSearchPrefill()`.
- [ ] `src/app/features/products/components/food-library-page/*` — 400 ms debounce, OFF UI, offline message, OFF tap → scan flow.
- [ ] `ngsw-config.json` + `src/app/core/pwa/ngsw-config.spec.ts` — exclude search API from SW cache.
- [ ] `_bmad-output/implementation-artifacts/sprint-status.yaml` — epic-11 + story 11-1 entries.

**Acceptance Criteria:**
- Given network available and query ≥ 3 chars after 400 ms debounce, when searching on food library page, then `OffSearchProvider` calls `search.openfoodfacts.org` with `langs=fr`.
- Given rate limit exceeded, when searching, then no additional OFF fetch occurs within the minute window.
- Given user taps an OFF result, when online, then scan reference form opens pre-filled (same as barcode OFF found).
- Given offline, when searching, then OFF section is hidden and an explicit offline message is shown.

## Verification

**Commands:**
- `npm test` — expected: all unit tests pass including new OFF search specs.
