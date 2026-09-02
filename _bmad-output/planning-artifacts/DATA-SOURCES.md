# Sources de données nutritionnelles — Nutrition

> Référence pour Epic 10–11 (post-MVP). Dernière mise à jour : 2026-09-01.

## Cascade de recherche unifiée (contrat verrouillé)

Un seul champ de recherche ; sections toujours dans cet ordre (vides masquées) :

```
Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA
   offline       offline     offline     online  online   online
```

| # | Source | Phase | Réseau |
|---|--------|-------|--------|
| 1 | Mon catalogue (IndexedDB) | — | ❌ |
| 2 | Ciqual embarqué | 1 | ❌ |
| 3 | OpenNutrition embarqué | 1 | ❌ |
| 4 | Open Food Facts Search-a-licious | 2 | ✅ |
| 5 | FoodRepo API | 2 | ✅ |
| 6 | USDA FoodData Central | 3 | ✅ |

Offline : sections 1–3. Online : 1–3 instantané, 4–6 en parallèle après debounce, affichage dans l'ordre ci-dessus.

---

## Sources intégrées (validées)

### Phase 1 — Offline embarqué

| Source | URL | Licence | Rôle |
|--------|-----|---------|------|
| **Ciqual ANSES** | [ciqual.anses.fr](https://ciqual.anses.fr/) | [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence) | Ingrédients génériques FR officiels (~3 484 aliments) |
| **OpenNutrition** | [opennutrition.app](https://www.opennutrition.app/) | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | Génériques + marques + barcode (~326k ; subset embarqué) |

**Build :** scripts de conversion au build (`scripts/build-food-library-*.ts`) — pas d'API runtime.

**Attribution requise :** écran Paramètres → Sources de données.

**OpenNutrition ODbL (story 10.2) :** toute interface affichant des données OpenNutrition doit créditer [OpenNutrition](https://www.opennutrition.app). Les données issues d'Open Food Facts conservent l'attribution « (c) Open Food Facts contributors ». Rebuild trimestriel depuis `opennutrition-dataset-*.zip` (https://downloads.opennutrition.app/) ; subset FR/EU filtré au build (~5–15k entrées).

### Phase 2 — APIs marques (réseau, lecture seule)

| Source | URL | Licence | Auth | Rate limit | Rôle |
|--------|-----|---------|------|------------|------|
| **Open Food Facts** | [world.openfoodfacts.org](https://world.openfoodfacts.org/) | ODbL | Aucune | ~10 req/min search | Marques FR/EU ; scan + Search-a-licious |
| **FoodRepo** | [foodrepo.org](https://www.foodrepo.org/) | CC-BY 4.0 | Clé gratuite | À documenter | Complément marques (surtout CH) |

**Endpoints :**
- OFF barcode : `GET /api/v2/product/{code}` (existant)
- OFF search : `GET search.openfoodfacts.org/search?q=...&langs=fr`
- FoodRepo : `GET foodrepo.org/api/v3/products/_search` (Token header)

### Phase 3 — USDA (obligatoire)

| Source | URL | Licence | Auth | Rate limit | Rôle |
|--------|-----|---------|------|------------|------|
| **USDA FoodData Central** | [fdc.nal.usda.gov](https://fdc.nal.usda.gov/) | Domaine public US | Clé api.data.gov gratuite | 1 000 req/h | Fallback génériques + marques US/international |

**Endpoint :** `GET https://api.nal.usda.gov/fdc/v1/foods/search?api_key=...&query=...`

**Filtres recommandés :** `dataType=Foundation,SR Legacy,Branded`

## Données envoyées aux APIs

| Envoyé | Non envoyé |
|--------|------------|
| Terme de recherche (ex. « skyr ») | Garde-manger, plan, objectifs macros |
| Code-barres (lookup) | Historique repas, export backup |
| Clé API (USDA, FoodRepo) — locale | Données personnelles identifiantes |

## Sources écartées

| Source | Motif |
|--------|-------|
| EuroFIR FoodEXplorer | Pas d'API publique gratuite |
| Edamam, Nutritionix, Spoonacular, FatSecret | Commercial, quotas, ToS |
| OpenNutrition DeepSearch | Produit payant / pas d'API libre |
| Scraping distributeurs | Fragile, non open data |

## Mise à jour des données offline

- **Ciqual :** rebuild annuel ou à la sortie d'une nouvelle table ANSES.
- **OpenNutrition :** rebuild trimestriel depuis TSV upstream ; re-filtrer subset FR/EU.
- Versioning : `foodLibraryManifest.version` dans les assets.
