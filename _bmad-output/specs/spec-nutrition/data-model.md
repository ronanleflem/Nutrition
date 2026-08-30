# Modèle de données — Nutrition MVP

> Remplace le schéma `products` monolithique de l’addendum PRD. Gouverné par `ARCHITECTURE-SPINE.md` (AD-3, AD-4, AD-13, AD-14).

## Tables IndexedDB (Dexie)

### products

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | UUID |
| name | string | Nom générique |
| category | string? | LAITIER, FROMAGE, SAUCE… |
| priority | enum? | `green`, `yellow`, `gray` |
| alternativeRemark | string? | Excel « Alternative / Remarque » |
| notes | string? | |
| preferredReferenceId | string? | Macros canoniques |
| recommendedStores | string[] | Ordre suggestions magasin |
| deletedAt | ISO? | Soft delete |
| createdAt, updatedAt | ISO | |

### productReferences

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | |
| productId | string | FK products |
| store | enum | carrefour, auchan, … |
| brand | string? | |
| label | string | Nom étiquette |
| barcode | string? | Index unique actif |
| kcalPer100g, proteinPer100g, fatPer100g, carbsPer100g | number | |
| fiberPer100g, saltPer100g | number? | |
| ingredients | string? | Composition |
| price, pricePerKg | number? | |
| nutritionalScore | number | Recalcul au save ; index tri |
| verdictLabel | string? | 🟢 Excellent… |
| notes | string? | |
| deletedAt | ISO? | |
| createdAt, updatedAt | ISO | |

### recipes

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | |
| title | string | |
| steps | string[] | |
| durationMin | number? | |
| defaultPortions | number | |
| tags | string[]? | |
| notes | string? | |
| defaultVariantId | string | Obligatoire si >1 variante |
| createdAt, updatedAt | ISO | |

### recipeVariants

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | |
| recipeId | string | |
| name | string | « Lavash », « Double protéine » |
| rating | number? | 1–5 étoiles |
| notes | string? | |
| sortOrder | number? | |
| createdAt | ISO | |

### recipeIngredients

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | |
| variantId | string | FK recipeVariants |
| productId | string | FK products (générique) |
| quantityG | number | |
| slotLabel | string? | « pain », « protéine » |

### pantryItems

| Champ | Type | Notes |
| --- | --- | --- |
| id, productId, quantityG | | |
| expiryDate, location | optional | |
| updatedAt | ISO | |

### mealPlanEntries

| Champ | Type | Notes |
| --- | --- | --- |
| id | string | |
| date | ISO date | |
| slot | enum | breakfast, lunch, dinner |
| recipeId | string | |
| recipeVariantId | string? | Null = choix plus tard ; résolu via default |

### shoppingListItems, macroGoals, appSettings

Alignés addendum PRD (shopping `source: auto|manual`, goals singleton, settings theme dark).

## Index Dexie

- `productReferences`: `productId`, `barcode`, `nutritionalScore`, `store`
- `recipeVariants`: `recipeId`
- `recipeIngredients`: `variantId`

## Export JSON

Inclure toutes tables ci-dessus. `schemaVersion: 1` (ou 2 si migration explicite lors implémentation). Import merge : products par barcode / name+brand sur **products** et **productReferences** selon règles PRD §10.

## Calculs

- **Macros variante** : somme `(macroPer100g from product.preferredReference) * quantityG / 100` ; par portion = total / `defaultPortions`.
- **Synthèse jour** : somme macros portion × 1 entrée plan par créneau, variante résolue.
- **Liste courses** : ingrédients des variantes résolues du plan ; `needed = plannedG - pantryG`.
