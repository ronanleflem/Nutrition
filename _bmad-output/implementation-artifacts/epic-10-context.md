# Epic 10 Context: Bibliothèque offline multi-sources (Phase 1)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable offline search and import of generic French foods and common branded items by embedding Ciqual and OpenNutrition datasets as lazy-loaded JSON chunks. This epic delivers the data pipelines and local search foundation before online providers (Epic 11) extend the unified cascade.

## Stories

- Story 10.1: Pipeline Ciqual → chunk `food-library-ciqual`
- Story 10.2: Pipeline OpenNutrition → chunk `food-library-opennutrition`
- Story 10.3: FoodSearchService — index local unifié
- Story 10.4: Importer vers mon catalogue
- Story 10.5: Recherche unifiée lors ajout ingrédient recette
- Story 10.6: Import groupé pack démarrage

## Requirements & Constraints

- Unified search cascade order (offline sections): Mon catalogue → Ciqual → OpenNutrition.
- Embedded libraries are build-time JSON assets; no runtime API calls to Ciqual or OpenNutrition.
- Each search result must show its source before import (FR-37).
- Import from library creates a local `Product` copy with macros per 100 g (FR-27).
- Offline barcode lookup via OpenNutrition index (FR-36).
- Combined Ciqual + OpenNutrition chunks target < 3 Mo gzip (NFR-13); Ciqual alone < 1.5 Mo gzip.
- Local type-ahead search < 100 ms on combined index ≤ 10k entries (NFR-14).
- Ciqual: Etalab 2.0 licence; OpenNutrition: ODbL — attributions in Settings (later stories).
- No backend, no cloud sync, no sending personal data to third parties.

## Technical Decisions

- Build scripts at `scripts/build-food-library-*.ts` convert upstream open data to versioned JSON under `src/assets/food-library/`.
- Manifest fields: `libraryVersion`, `source` (`ciqual` | `opennutrition`), entry count metadata.
- Ciqual entry shape: `id`, `nameFr`, `category`, `kcal`, `proteinG`, `fatG`, `carbsG`, `fiberG`, `aliases[]` — all macros per 100 g.
- Source XML files live in `data/ciqual/` (gitignored); generated JSON is committed for app use without rebuild.
- Lazy-load chunks via Angular assets; register `src/assets` in `angular.json`.
- Shared types in `src/app/core/food-library/` for runtime consumers and build scripts.

## UX & Interaction Patterns

- Product picker will group results: « Ciqual » then « OpenNutrition » with source badges.
- Recipe ingredient picker: single field covering catalogue + offline libraries (Story 10.5).
- Starter pack: one-tap import of ~50 base Ciqual ingredients (Story 10.6).

## Cross-Story Dependencies

- 10.2 depends on 10.1 pattern for build pipeline and asset layout.
- 10.3 requires both chunks from 10.1 and 10.2.
- 10.4–10.6 depend on 10.3 `FoodSearchService` and import logic.
- Epic 11 extends the same cascade with online providers OFF, FoodRepo, USDA.
