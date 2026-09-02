# Epic 11 Context: Recherche multi-providers (Phases 2 + 3)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Extend the unified food search cascade with online providers (Open Food Facts Search-a-licious, FoodRepo, USDA FDC) so users can find branded and international products by name when offline libraries and catalogue are insufficient. Providers run in parallel after debounce when online; offline surfaces show only sections 1–3 with explicit messaging.

## Stories

- Story 11.1: Provider OFF Search-a-licious (Phase 2)
- Story 11.2: Provider FoodRepo (Phase 2, complément marques)
- Story 11.3: Provider USDA FoodData Central (Phase 3 — obligatoire)
- Story 11.4: Recherche unifiée — implémentation cascade
- Story 11.5: Cache local recherches API
- Story 11.6: Paramètres clés API et attributions

## Requirements & Constraints

- Cascade order (locked): Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA.
- Empty sections hidden; offline = sections 1–3 live + cached online hits (story 11.5) with explicit offline message.
- OFF search: GET read-only to `search.openfoodfacts.org` with `langs=fr`; no personal data sent.
- Rate limits: OFF ≤ 10 req/min; debounce ≥ 400 ms; min 3 characters for online search.
- API timeout 5 s with explicit error when offline or unreachable.
- Each result shows source badge before import (FR-37).
- OFF branded tap → same preview/import flow as barcode scan (reference form pre-filled).
- No backend; API keys stored locally in IndexedDB (USDA/FoodRepo — later stories).

## Technical Decisions

- Build on Epic 10 `FoodSearchService` and picker patterns; add provider classes under `src/app/core/off-api/` (OFF) and future `food-library/` providers.
- Reuse `OffProductPrefill` mapping from barcode lookup for search hits.
- Service worker must not cache OFF search or barcode API responses (maxSize 0).
- Session-level in-memory cache for provider responses; IndexedDB search cache in story 11.5.

## UX & Interaction Patterns

- Single search field across picker surfaces; online providers load after debounce with per-section spinners (story 11.4).
- Optional manual « Rechercher en ligne » button (NFR-19) — story 11.4.
- Offline: hide live online sections, message + link to offline library; cached OFF/FoodRepo/USDA hits from IndexedDB still shown (story 11.5).

## Cross-Story Dependencies

- Depends on Epic 10 (`FoodSearchService`, library import, ingredient picker).
- 11.2–11.3 add providers; 11.4 wires full cascade on all surfaces; 11.5 adds IndexedDB cache; 11.6 adds API keys UI.
