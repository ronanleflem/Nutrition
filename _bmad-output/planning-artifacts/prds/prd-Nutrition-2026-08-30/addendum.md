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
| Framework | Angular 19+ (standalone components) |
| PWA | `@angular/service-worker` |
| DB | Dexie.js sur IndexedDB |
| Scanner | `@zxing/ngx-scanner` |
| OFF | `fetch` vers `world.openfoodfacts.org/api/v2/product/{barcode}` |
| Chiffrement export | Web Crypto API — PBKDF2 + AES-GCM |
| State | Angular signals + services |

## Schéma IndexedDB (draft)

```
products          id, name, brand, barcode?, kcal, protein, fat, carbs, fiber, ingredients, createdAt
pantryItems       id, productId, quantityG, expiryDate?, location?, updatedAt
recipes           id, title, steps[], durationMin, portions, tags[], createdAt
recipeIngredients id, recipeId, productId, quantityG
mealPlanEntries   id, date (ISO), slot (breakfast|lunch|dinner), recipeId
shoppingListItems id, productId, quantityG, checked, source (auto|manual), createdAt
macroGoals        id (singleton), kcal?, proteinG?, fatG?, carbsG?, fiberG?
appSettings       id (singleton), lastExportAt?, theme ('dark')
```

## Format export JSON

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-08-30T15:00:00.000Z",
  "app": "nutrition",
  "data": {
    "products": [],
    "pantryItems": [],
    "recipes": [],
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
