# Epic 6 Context: Plan de repas et choix variante

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable weekly meal planning: assign recipes to breakfast/lunch/dinner slots, choose variants at plan or cook time, and feed daily macro synthesis. This epic turns the placeholder `/plan` route into the core planning surface for the app.

## Stories

- Story 6.1: Vue semaine et assignation recette
- Story 6.2: Choix variante et lien synthèse

## Requirements & Constraints

- Week view: 7 days × 3 slots (petit-déj / déj / dîner); one recipe per date+slot.
- Initial assignment stores `recipeId` with `recipeVariantId: null`; resolved variant = `defaultVariantId` (AR-14).
- `mealPlanEntries` persisted in IndexedDB; access only via `DatabaseService`.
- Recipe picker: search, macro preview per portion on default variant.
- User can modify (change recipe) or delete a planned entry.
- UI in French; mobile-first; touch targets ≥ 44px.
- Feature folder: `meal-plan`; route `/plan` (bottom nav).

## Technical Decisions

- `MealPlanEntry`: `id`, `date` (ISO `YYYY-MM-DD`), `slot`, `recipeId`, `recipeVariantId?`.
- Dexie store `mealPlanEntries` already exists with index on `date`, `slot`, `recipeId`.
- Enforce uniqueness on `date+slot` at service layer.
- Variant selection UI (`VariantChipRow`) and live synthesis refresh belong to Story 6.2.

## UX & Interaction Patterns

- `WeekGrid`: empty slot shows « + » placeholder; filled slot shows truncated recipe name.
- Tap empty slot → bottom sheet recipe picker with search and macros/portion preview.
- Tap filled slot → detail sheet to change recipe or delete.
- Day selector: horizontal 7-day strip; selected day shows its 3 slots (mockup `meal-plan.html`).
- Links to macro synthesis and goals remain on Plan page.

## Cross-Story Dependencies

- Depends on Epic 4 recipes/variants/macros for picker content and previews.
- Story 6.2 adds variant chip and synthesis day link behavior.
- Epic 5 synthesis consumes meal plan entries (already implemented; needs entries from this epic).
