# Deferred Work

## Deferred from: code review stories 2.1–2.5 (2026-08-30)

- Couverture tests `ProductFormPageComponent` absente — dette de tests
- Première référence non auto-désignée préférée — amélioration UX hors AC strict
- Badge « Préférée » non testé en composant — dette tests
- Couverture tests page détail (banner préférence, tri références) — dette tests
- Flux scan → référence préférée non proposée automatiquement — hors AC
- Suggestion produit OFF : sélectionne toujours `products[0]` — amélioration UX
- Chemins invalid-EAN, OFF inconnu, caméra refusée, `restorePendingProduct` — gaps de tests documentés
- Confirmation archivage non testée au niveau composant — dette tests
- Bottom sheet restauration scanner non testée en composant — dette tests

## Deferred from: code review of spec-12-1-tableau-de-bord-accueil.md (2026-09-02)

- `loadDashboard` appelle `getRecipeDetail` par repas au lieu d’un titre déjà disponible via `listRecipes` — optimisation hors AC
- `updateHideHomeOnStartup` / `updateOnboardingCompleted` font un get+put hors transaction, comme les autres settings — pattern préexistant, single-user

## Deferred from: code review of spec-12-3-raccourcis-contextuels-cross-surfaces.md (2026-09-02)

- `appendIngredientToDefaultVariant` relit la recette hors transaction puis `put` le snapshot — course rare en single-user
