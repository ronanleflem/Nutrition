# Epic 1 Context: Fondations PWA et navigation

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver a installable Angular PWA foundation that is mobile-first, French-localized, dark-themed by default, and locally persistent. Users must reach every major surface (pantry, products, recipes, meal plan, shopping list, macro goals, settings) within two taps. This epic establishes the technical substrate—routing, IndexedDB access pattern, shell navigation, and offline shell—before domain features ship in later epics.

## Stories

- Story 1.1: Scaffold Angular PWA et routing lazy
- Story 1.2: DatabaseService et schéma Dexie initial
- Story 1.3: Thème sombre et shell navigation
- Story 1.4: Service Worker shell offline

## Requirements & Constraints

- PWA installable on home screen with valid manifest (name Nutrition, icons, `display: standalone`).
- All business data persisted in IndexedDB without an application backend.
- Dark theme on first launch with WCAG AA contrast (≥ 4.5:1).
- Bottom navigation with five French tabs plus settings gear on all screens.
- Lazy-loaded routes per feature domain; shell and critical paths work offline after first visit.
- UI and messages entirely in French.
- No third-party analytics; no user data sent externally except future read-only Open Food Facts lookups.
- First Contentful Paint target under 3s on mid-range mobile over 4G.

## Technical Decisions

- Angular 22.1.4 standalone components, signals where appropriate, npm package manager.
- Feature folders under `src/app/features/`: `pantry`, `products`, `recipes`, `meal-plan`, `shopping-list`, `macro-goals`, `settings`.
- Only `DatabaseService` in `core/` may access Dexie/IndexedDB (story 1.2).
- `@angular/service-worker` for PWA; no external starter templates.
- IDs via `crypto.randomUUID()`; dates ISO 8601 UTC; soft delete via nullable `deletedAt`.
- Lazy routes: `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`, `/goals`, `/settings`.

## UX & Interaction Patterns

- Bottom nav: Garde-manger, Produits, Recettes, Plan, Courses (five tabs).
- Settings gear opens `/settings` from any screen.
- Visual tokens: surface `#121212`, accent sage `#7CB87C`, system font stack.
- Touch targets ≥ 44px; respect `prefers-reduced-motion`.

## Cross-Story Dependencies

- Story 1.1 must complete before 1.2–1.4 (project scaffold and lazy routes).
- Story 1.2 (Dexie) is required before features persist data (epic 2+).
- Story 1.3 depends on 1.1 routes; story 1.4 depends on PWA scaffold from 1.1.
