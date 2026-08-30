# Epic 5 Context: Objectifs macros et synthèse

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable the user to define daily macro targets (kcal, protein, fat, carbs, fiber) and compare them against the meal plan. This epic delivers the goals form and daily macro synthesis bars so meal planning becomes actionable against personal nutrition targets.

## Stories

- Story 5.1: Formulaire objectifs macros
- Story 5.2: Synthèse macros journalière

## Requirements & Constraints

- Macro goals are a local singleton entity; each nutrient field is optional (empty = not tracked).
- Units: grams for P/L/G/fiber with explicit « g » in UI; kcal without gram suffix.
- Goals persist in IndexedDB `macroGoals` store; no network required.
- Daily synthesis (Story 5.2) aggregates resolved recipe variant macros per meal plan entry and compares to goals with ±5% visual states.
- UI in French; mobile-first touch targets ≥ 44px.
- Feature folder: `macro-goals`; route `/goals` (not in bottom nav).

## Technical Decisions

- `macroGoals` singleton id pattern mirrors `appSettings` (`id: 'singleton'`).
- Fields: `kcal?`, `proteinG?`, `fatG?`, `carbsG?`, `fiberG?` (architecture spine).
- Dexie migration adds `macroGoals: 'id'` store; access only via `DatabaseService`.
- Resolved variant for future synthesis: `mealPlanEntry.recipeVariantId ?? recipe.defaultVariantId`.
- Export/import will merge macro goals field-by-field (import non-null wins) — handled in Epic 8.

## UX & Interaction Patterns

- `/goals` reachable from Plan (link « Objectifs ») and Settings.
- Goals form: numeric inputs, empty fields allowed, explicit gram labels.
- Story 5.2 adds `MacroBarGroup` with under/met/over states and bottom sheet meal detail on bar tap.

## Cross-Story Dependencies

- Story 5.1 is prerequisite for 5.2 (synthesis needs stored goals).
- Story 5.2 depends on meal plan entries and recipe variant macros (Epics 4 and 6) for aggregation; 5.1 can ship independently with form-only scope.
- Epic 6 meal plan provides entries consumed by 5.2 synthesis.
