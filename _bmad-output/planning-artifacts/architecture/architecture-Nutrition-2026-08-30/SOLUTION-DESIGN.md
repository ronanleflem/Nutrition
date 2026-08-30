# Solution design — Nutrition MVP

> Document humain complémentaire à `ARCHITECTURE-SPINE.md`.  
> Audience : développeur solo (Ronan). Langue : français.

## 1. Objectif

Nutrition est une PWA Angular **local-first** pour gérer un catalogue alimentaire orienté macros, le garde-manger, les recettes, le plan de repas, la liste de courses et la synthèse journalière — **sans compte cloud**.

Cette architecture formalise le passage d’un **tableur Excel** (catalogue + comparatif enseignes) vers une application structurée, tout en gardant le modèle mental : **produit générique** + **références par magasin**.

## 2. Paradigme

**Modules feature + core plateforme**

- **`core/`** — Dexie, backup, score nutritionnel, Open Food Facts, layout sombre
- **`features/*`** — une feature Angular par domaine métier, routes lazy
- **État** — signals + services (pas NgRx)
- **Données** — seul `DatabaseService` touche IndexedDB

## 3. Modèle catalogue (Excel → app)

### 3.1 Deux niveaux

| Excel | App | Exemple |
|-------|-----|---------|
| Ligne « Skyr nature » | `Product` | Nom, catégorie LAITIER, priorité 🟢, remarque |
| Ligne « Danone Skyr Auchan » | `ProductReference` | Macros, prix, score, barcode, enseigne |

### 3.2 Champs MVP (alignés Excel)

**Product (générique)**

| Champ | Excel | Usage |
|-------|-------|-------|
| `name` | Produit | « Skyr nature » |
| `category` | Catégorie | LAITIER, FROMAGE, SAUCE… |
| `priority` | Priorité | `green` / `yellow` / `gray` |
| `alternativeRemark` | Alternative / Remarque | « Marque distributeur OK » |
| `notes` | — | Notes libres |
| `preferredReferenceId` | — | Référence pour macros canoniques |
| `recommendedStores[]` | Enseigne conseillée (+ ordre) | `['auchan','carrefour']` |

**ProductReference (SKU)**

| Champ | Excel | Usage |
|-------|-------|-------|
| `label` | Référence | « Auchan Fromage blanc 0% 1kg » |
| `store` | Enseigne | `auchan` |
| `brand` | — | Marque si distincte du label |
| `barcode` | — | Scan / OFF |
| Macros / 100 g | Kcal, Protéines, Lipides, Glucides… | Calcul recettes |
| `ingredients` | Composition | Liste ingrédients |
| `price`, `pricePerKg` | Prix, Prix/kg | Info magasin |
| `nutritionalScore` | Score nutritionnel | Tri catalogue |
| `verdictLabel` | Verdict | « 🏆 Excellent » (optionnel, dérivé ou saisi) |
| `notes` | — | Remarques sur cette ref |

### 3.3 Règles métier clés

1. **Garde-manger, recettes, courses** → toujours `productId` (générique), pas `referenceId`.
2. **Macros recettes / synthèse plan** → macros de `preferredReferenceId` (100 g).
3. **Enseigne principale** = enseigne de la référence préférée (pas un champ séparé).
4. **Liste ordonnée** `recommendedStores[]` pour suggestions en magasin ; défaut = tri des refs par score ↓.
5. **Score** — recalculé à chaque save de référence ; stocké pour tri Dexie.

### 3.4 Formule score (rappel)

- 45 % — efficacité protéique (prot / 100 kcal)
- 35 % — qualité composition (sucres ajoutés, sel, transformation — heuristique)
- 20 % — densité calorique (vs catégorie)

Implémentation : `NutritionalScoreService` — une seule source de la formule.

## 4. Flux principaux

### 4.1 Scan en magasin

```
Scan barcode
  → lookup productReferences.barcode
  → si trouvé : éditer / rattacher Product
  → sinon GET OFF
  → créer ProductReference (+ Product si nouveau)
  → proposer comme preferredReference
```

### 4.2 Créer une recette

```
Choisir Product (générique) en ingrédient
  → lire preferredReference macros/100g
  → contribution = macro * quantityG / 100
  → total / portions
```

### 4.3 Liste de courses

```
Agréger ingrédients plan (productId)
  → needed = plannedG - pantryG
  → shoppingListItems (source auto)
  → afficher recommendedStores pour chaque Product
```

## 5. Stack & déploiement

| Couche | Choix |
|--------|-------|
| UI | Angular 22.1.4 PWA, thème sombre |
| DB | Dexie 4.4.5 / IndexedDB |
| Scan | @zxing/ngx-scanner |
| OFF | fetch GET, cache session |
| Backup | JSON `schemaVersion: 1` + AES-GCM optionnel |

**Pas de serveur** au MVP. Hébergement = fichiers statiques (GitHub Pages, Netlify, etc.).

## 6. Structure code cible

```
src/app/core/          → DatabaseService, BackupService, NutritionalScoreService, OffApiService
src/app/features/
  products/            → catalogue + références + tri score
  pantry/
  recipes/
  meal-plan/
  shopping-list/
  macro-goals/
  settings/
```

## 7. Écart PRD addendum → spine

Le schéma `products` monolithique de l’addendum PRD est **remplacé** par `products` + `productReferences`. Les autres tables (pantry, recipes, plan, shopping, goals, settings) restent alignées.

**Action downstream :** mettre à jour `addendum.md` PRD ou adopter la spine via `bmad-spec` avant epics/stories.

## 8. Hors MVP (reporté)

- Thème clair, sync cloud, journal type MyFitnessPal
- Import prix automatique depuis enseignes
- Vue comparatif Excel complète (toutes enseignes en grille) — MVP = liste refs + tri score
- NgRx, backend FastAPI/Spring

## 9. Artefacts liés

| Document | Chemin |
|----------|--------|
| Spine (contrat build) | `ARCHITECTURE-SPINE.md` |
| PRD | `../prds/prd-Nutrition-2026-08-30/prd.md` |
| Catalogue source Excel | `../sources/nutrition-catalogue-excel-debut.pdf` |
| Memlog (audit) | `.memlog.md` |
