# Glossaire — Nutrition SPEC

| Terme | Définition |
| --- | --- |
| **Product** | Produit **générique** du catalogue (ex. « Skyr nature ») : catégorie, priorité, remarques, `recommendedStores[]`, `preferredReferenceId`. |
| **ProductReference** | SKU **enseigne/marque** : label, store, barcode, macros / 100 g, prix, `nutritionalScore`, composition. |
| **Recipe** | Famille recette : titre, étapes partagées, `defaultPortions`, `defaultVariantId`, notes. |
| **RecipeVariant** | Déclinaison : substitution produit ou scale quantités ; `rating` étoiles optionnel. |
| **Variante résolue** | Pour une entrée plan : `mealPlanEntry.recipeVariantId` si défini, sinon `recipe.defaultVariantId`. |
| **Garde-manger** | Stock `pantryItems` lié à `productId`, quantité en grammes. |
| **Synthèse macros** | Total journalier des macros des variantes résolues du plan vs objectifs. |
| **OFF** | Open Food Facts — enrichissement produit par barcode, GET uniquement. |
| **Mode Courses** | Vue liste plein écran, gros touch targets, offline. |
