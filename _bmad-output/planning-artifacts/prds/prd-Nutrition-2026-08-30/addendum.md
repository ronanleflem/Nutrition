# Addendum PRD — Nutrition

Détails techniques et décisions de transport pour `bmad-architecture` et `bmad-create-epics-and-stories`.

## Décisions design verrouillées

| Décision | Choix |
|----------|-------|
| Thème par défaut | **Sombre** — fond `#121212` ou équivalent, accents verts/sauge pour actions positives |
| Usage magasin | Contraste élevé, pas de animations distrayantes en Mode Courses |
| Thème clair | Hors MVP (v1.1 via CSS variables si architecture le prévoit) |
| Typographie | System font stack (perf PWA) |
| Langue | Français partout |

## Stack technique (pour architecture)

| Couche | Choix |
|--------|-------|
| Framework | Angular 22.1.4 (standalone components) |
| PWA | `@angular/service-worker` |
| DB | Dexie.js sur IndexedDB |
| Scanner | `@zxing/ngx-scanner` |
| OFF | `fetch` vers `world.openfoodfacts.org/api/v2/product/{barcode}` |
| Chiffrement export | Web Crypto API — PBKDF2 + AES-GCM |
| State | Angular signals + services |

## Schéma IndexedDB

> **Supersédé** par le SPEC canonique et l’architecture spine (Product + ProductReference, Recipe + RecipeVariant). Source de vérité implémentation :

`_bmad-output/specs/spec-nutrition/data-model.md`

Résumé MVP :

```
products, productReferences
recipes, recipeVariants, recipeIngredients (variantId)
pantryItems, mealPlanEntries (+ recipeVariantId?)
shoppingListItems, macroGoals, appSettings
```

Voir aussi `ARCHITECTURE-SPINE.md` (AD-3, AD-4, AD-13, AD-14).

## Format export JSON

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-08-30T15:00:00.000Z",
  "app": "nutrition",
  "data": {
    "products": [],
    "productReferences": [],
    "recipes": [],
    "recipeVariants": [],
    "recipeIngredients": [],
    "mealPlanEntries": [],
    "shoppingListItems": [],
    "macroGoals": {},
    "appSettings": {}
  }
}
```

Fichier chiffré : envelope `{ "v": 1, "salt": "...", "iv": "...", "ciphertext": "..." }`.

## Calcul macros Recette

Pour chaque `recipeIngredient` :
```
contribution = (product.macroPer100g * ingredient.quantityG) / 100
```
Total Recette = somme des contributions. Par portion = total / `recipe.portions`.

## Calcul Synthèse journalière

Pour chaque `mealPlanEntry` du jour :
```
dayTotal += recipe.macrosPerPortion  // 1 portion planifiée par créneau
```
Comparer `dayTotal` à `macroGoals` ; afficher delta absolu et % si objectif défini.

## Calcul Liste de Courses

1. Agréger tous les ingrédients des Recettes du Plan (fenêtre configurable : semaine courante par défaut).
2. Pour chaque Produit : `needed = max(0, plannedG - pantryG)`.
3. Créer/mettre à jour `shoppingListItem` avec `source: auto`.

## Régénération Liste de Courses (décidé)

1. Supprimer tous les `shoppingListItem` où `source = auto`.
2. Recalculer les besoins depuis Plan − Garde-manger.
3. Insérer les nouveaux items auto (`checked = false`).
4. Ne **pas** modifier les items `source = manual` (quantité ni état coché).

## Soft delete Produit (décidé)

- `deletedAt` ISO timestamp ; `null` = actif.
- Requêtes liste : `WHERE deletedAt IS NULL`.
- Restauration : `deletedAt = null`.
- Scan d’un barcode existant sur Produit archivé → proposer restauration.

## Garde-manger quantité 0 (décidé)

- `quantityG <= 0` → `DELETE` la ligne `pantryItem`.

## Import merge — algorithme (décidé)

```
1. Construire productIdMap : oldImportId → localId
   Pour chaque product importé :
     a. Si barcode match local actif → map + UPDATE champs
     b. Sinon si name+brand normalisés match → map + UPDATE
     c. Sinon INSERT nouveau product, map old→new

2. PantryItems importés : pour chaque ligne, résoudre productId via map
   Si pantry local existe pour ce productId → quantityG += import.quantityG
   Sinon INSERT

3. Recipes : si id existe localement → REPLACE recipe + ingredients
   Sinon INSERT avec nouvel id (ne pas réutiliser id import si collision sans match)

4. MealPlanEntries : UPSERT par (date, slot)

5. MacroGoals : merge champ par champ (import non-null gagne)

6. ShoppingListItems : SKIP en mode fusion

7. AppSettings : lastExportAt = max
```

Mode **Remplacer tout** : transaction unique clear-all + bulk insert.

## Surfaces navigation (IA)

| Onglet / route | Feature |
|----------------|---------|
| `/pantry` | Garde-manger |
| `/products` | Catalogue + scan |
| `/recipes` | Recettes |
| `/plan` | Plan de Repas + Synthèse |
| `/shopping` | Liste + Mode Courses |
| `/goals` | Objectifs Macros |
| `/settings` | Export, Import, À propos |

## Recommandations architecture (non normatives)

- Feature folders avec lazy loading.
- `DatabaseService` central (Dexie).
- `BackupService` isolé (export/import/chiffrement).
- `OffApiService` avec cache mémoire session (pas persistant MVP).
- Service Worker : cache shell app + assets ; pas de cache OFF.

## Epics → stories indicatives (premier découpage)

### E1 — Fondations
- E1-1 Scaffold Angular PWA + routing
- E1-2 Dexie schema + DatabaseService
- E1-3 Thème sombre + layout mobile (bottom nav)
- E1-4 Service Worker offline shell

### E2 — Produits
- E2-1 CRUD Produit manuel
- E2-2 Scanner + OFF lookup
- E2-3 Liste Produits + recherche

### E3 — Garde-manger
- E3-1 CRUD stock
- E3-2 Alertes DLC

### E4 — Recettes
- E4-1 CRUD Recette
- E4-2 Calcul macros

### E5 — Objectifs
- E5-1 Formulaire Objectifs Macros
- E5-2 Synthèse journalière

### E6 — Plan
- E6-1 Vue semaine + assignation Recette

### E7 — Courses
- E7-1 Génération auto
- E7-2 Édition manuelle
- E7-3 Mode Courses

### E8 — Backup
- E8-1 Export JSON + chiffrement
- E8-2 Import + validation
- E8-3 Rappel 30 jours

## Post-MVP (Epics 9–12)

> [`epics-post-mvp.md`](./epics-post-mvp.md) · [`DATA-SOURCES.md`](../../DATA-SOURCES.md)

**Cascade recherche unifiée :** `Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA`

| Epic | Titre | Priorité |
|------|-------|----------|
| E10 | Bibliothèque offline Ciqual + OpenNutrition | #1 — sections 1–3 |
| E11 | Providers OFF + FoodRepo + USDA | #2–3 — cascade complète |
| E9 | Identité visuelle sombre chaleureuse | #4 |
| E12 | Accueil intelligent et onboarding recette | #5 |
