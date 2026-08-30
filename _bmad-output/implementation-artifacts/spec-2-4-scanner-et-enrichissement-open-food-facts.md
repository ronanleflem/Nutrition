---
title: 'Story 2.4 — Scanner et enrichissement Open Food Facts'
type: 'feature'
created: '2026-08-30'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '1101711883221937aa153283be9829ed917dd05e'
story_key: '2-4-scanner-et-enrichissement-open-food-facts'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-3-liste-catalogue-recherche-et-tri.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users in-store cannot quickly add a product reference by scanning a barcode; manual entry is too slow.

**Approach:** Add FAB scan on `/products`, full-screen scanner with manual fallback, `OffApiService` GET lookup, and a pre-filled reference form editable before save.

## Boundaries & Constraints

**Always:**
- `OffApiService` GET only to `world.openfoodfacts.org/api/v2/product/{barcode}` — no personal data (FR-8, AR-8, NFR-4).
- Session memory cache for OFF responses (AR-8).
- Barcode stored on `ProductReference`, not `Product` (AR-9).
- iOS: « Saisir le code » prominent, no camera attempt (NFR-10, UX-DR13).
- Camera denied/unavailable → immediate manual entry (FR-7, UX-DR13).
- Offline → explicit message + manual form with barcode pre-filled (NFR-9).
- Unknown OFF (`status !== 1`) → « Produit inconnu » + manual form with barcode (FR-8).

**Ask First:**
- Restoring archived product on barcode match (story 2.5).

**Never:**
- POST to OFF or send user data.
- Cache OFF in service worker (AR-8).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| OFF found | Valid EAN, online, status=1 | Reference form pre-filled (label, brand, macros, ingredients) | N/A |
| OFF unknown | Valid EAN, status≠1 | « Produit inconnu » banner + barcode pre-filled | N/A |
| Offline | Valid EAN, navigator offline | Offline banner + manual form | N/A |
| Local match | Barcode exists in DB | Navigate to product detail | N/A |
| Invalid EAN | Bad check digit | Error message on scanner | Stay on scanner |
| iOS | iPhone UA | No camera, manual entry first | N/A |
| Camera denied | permissionResponse=false | Hide camera, manual entry | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/off-api/off-api.service.ts` — OFF GET + session cache + response mapping.
- `src/app/core/barcode/ean.ts` — EAN-8/13 validation.
- `src/app/core/platform/is-ios.ts` — iOS detection for camera skip.
- `src/app/features/products/components/scanner-page/` — FAB target, camera + manual entry.
- `src/app/features/products/components/scan-reference-page/` — pre-filled reference form + product picker.
- `src/app/features/products/services/scan.service.ts` — barcode resolution orchestration.
- `src/app/core/database/database.service.ts` — `getActiveReferenceByBarcode`.

## Tasks & Acceptance

**Execution:**
- [x] `off-api.service.ts` — OFF GET, session cache, prefill mapping.
- [x] `ean.ts` + `is-ios.ts` — validation and platform detection.
- [x] `scanner-page` — camera (Android), manual entry, iOS skip.
- [x] `scan-reference-page` — pre-filled form, unknown/offline banners.
- [x] `scan.service.ts` — local lookup, OFF lookup, navigation.
- [x] `products-page` — FAB scan 56px (UX-DR4).
- [x] `database.service.ts` — barcode index lookup.
- [x] Unit tests for OFF, scan flow, EAN, iOS, database barcode lookup.

**Acceptance Criteria:**
- Given products screen, when displayed, then FAB scan is visible (UX-DR4).
- Given valid EAN on Android, when scanned, then `OffApiService` calls OFF GET without personal data (FR-8, AR-8).
- Given OFF match, when form opens, then reference fields are pre-filled and editable before save (FR-8).
- Given OFF `status !== 1`, when form opens, then « Produit inconnu » + barcode pre-filled (FR-8, NFR-9).
- Given camera denied or iOS, when scanner opens, then manual entry is available immediately (FR-7, UX-DR13, NFR-10).
- Given offline, when barcode submitted, then offline message + manual form (NFR-9).
- Given save, when reference created, then barcode is on ProductReference (AR-9).

## Spec Change Log

## Verification

**Commands:**
- `npm run build` — expected: production build succeeds.
- `npm test` — expected: all tests pass.
