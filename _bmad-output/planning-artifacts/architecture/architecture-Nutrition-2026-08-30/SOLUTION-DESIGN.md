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

## 4. Modèle recettes — familles et variantes (MVP)

### 4.1 Structure

| Entité | Rôle | Exemple |
|--------|------|---------|
| `Recipe` | Famille — étapes communes | « Wrap poulet » |
| `RecipeVariant` | Déclinaison | « Extra Fins », « Lavash », « Double protéine » |
| `RecipeIngredient` | Ingrédient d’**une** variante | `variantId`, `productId`, `quantityG`, `slotLabel?` |

**Types de déclinaison (MVP)** — chaque cas = une variante nommée :

- **Substitution** — lavash au lieu de wrap (produit différent, quantités proches)
- **Scale macros** — +50 g poulet (mêmes produits, quantités différentes)
- **Recette différente** (rare) — encore une variante avec liste d’ingrédients distincte

### 4.2 Notation

- `RecipeVariant.rating` — étoiles 1–5 (prioritaire), sur la **variante** (« la version lavash est top »)
- `Recipe.notes` — notes libres sur la famille
- **Pas** de score nutritionnel auto sur recette au MVP — tu juges via macros affichées vs restant calorique du jour

### 4.3 Plan vs cook

```
mealPlanEntry.recipeVariantId nullable
  → choisi dimanche soir OU laissé vide
  → jour J (cook) : picker variante → met à jour recipeVariantId

Variante résolue pour macros / courses :
  entry.recipeVariantId ?? recipe.defaultVariantId
```

- **Synthèse macros** — utilise la variante résolue (ou défaut si pas encore choisi)
- **Liste courses** — agrège ingrédients des variantes résolues du plan
- **Cook UI** — changer variante recalcule la synthèse du jour

### 4.4 Exemple

**Wrap poulet** (`Recipe`)

| Variante | Différence |
|----------|------------|
| Extra Fins | Wrap Old El Paso 32 g, poulet 120 g |
| Lavash | Lavash 40 g, poulet 120 g |
| Double protéine | Wrap Extra Fins, poulet 180 g |

Plan dimanche : « Wrap poulet » sans variante → synthèse utilise `defaultVariantId`.  
Jour J : tu choisis Lavash → `recipeVariantId` mis à jour, synthèse ajustée.

## 5. Flux principaux

### 5.1 Scan en magasin

```
Scan barcode
  → lookup productReferences.barcode
  → si trouvé : éditer / rattacher Product
  → sinon GET OFF
  → créer ProductReference (+ Product si nouveau)
  → proposer comme preferredReference
```

### 5.2 Créer une recette

```
Créer Recipe (famille) + première RecipeVariant
  → ajouter recipeIngredients sur variantId
  → créer variantes additionnelles (substitution / scale)
  → définir defaultVariantId
  → optionnel : rating sur variante
```

### 5.3 Liste de courses

```
Agréger ingrédients plan (variante résolue par entrée)
  → needed = plannedG - pantryG
  → shoppingListItems (source auto)
  → afficher recommendedStores pour chaque Product
```

## 6. Stack & déploiement

| Couche | Choix |
|--------|-------|
| UI | Angular 22.1.4 PWA, thème sombre |
| DB | Dexie 4.4.5 / IndexedDB |
| Scan | @zxing/ngx-scanner |
| OFF | fetch GET, cache session |
| Backup | JSON `schemaVersion: 1` + AES-GCM optionnel |

**Pas de serveur** au MVP. Hébergement = fichiers statiques (GitHub Pages, Netlify, etc.).

## 7. Structure code cible

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

## 8. Écart PRD addendum → spine

Le schéma `products` monolithique de l’addendum PRD est **remplacé** par `products` + `productReferences`. Les recettes passent de `recipe` + `recipeIngredients(recipeId)` à **famille + variantes** (`recipeVariants`, `recipeIngredients.variantId`, `mealPlanEntries.recipeVariantId`).

**Action downstream :** mettre à jour `addendum.md` PRD ou adopter la spine via `bmad-spec` avant epics/stories.

## 9. Hors MVP (reporté)

- Thème clair, sync cloud, journal type MyFitnessPal
- Import prix automatique depuis enseignes
- Vue comparatif Excel complète (toutes enseignes en grille) — MVP = liste refs + tri score
- NgRx, backend FastAPI/Spring

## 10. Artefacts liés

| Document | Chemin |
|----------|--------|
| Spine (contrat build) | `ARCHITECTURE-SPINE.md` |
| PRD | `../prds/prd-Nutrition-2026-08-30/prd.md` |
| Catalogue source Excel | `../sources/nutrition-catalogue-excel-debut.pdf` |
| Memlog (audit) | `.memlog.md` |
