---
title: "Epics post-MVP — Nutrition"
status: draft
created: 2026-09-01
updated: 2026-09-01
source: "Retour utilisateur post-MVP — friction recettes, recherche produits, identité visuelle"
inputDocuments:
  - planning-artifacts/brief-2026-08-30/brief.md
  - planning-artifacts/prds/prd-Nutrition-2026-08-30/prd.md
  - planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md
  - planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md
  - project-context.md
decisions_locked:
  - "Priorité #1 : réduire la friction saisie ingrédients / macros recettes"
  - "Recherche produit utile à la maison ET en magasin (pas scan seul)"
  - "Thème toujours sombre, plus chaleureux — pas de thème clair v1.1"
  - "Pas de journal alimentaire repas-par-rep — reste assistant courses-cuisine-planification"
  - "3 phases données validées : offline → APIs marques → USDA (obligatoire, pas optionnel)"
---

# Nutrition — Epics post-MVP

## Contexte et décisions verrouillées

Le MVP (Epics 1–8) couvre le parcours courses-cuisine-planification. Le retour utilisateur identifie trois manques :

| Besoin exprimé | Décision produit |
|----------------|------------------|
| Saisie pénible des ingrédients / macros en recette | **Epic 10** en priorité absolue |
| Recherche type MyFitnessPal (« œuf », « skyr ») | **3 phases données** (voir ci-dessous) |
| Marques avec macros / calories | OFF + OpenNutrition offline + FoodRepo + USDA |
| App trop sobre | **Epic 9** — sombre chaleureux |
| Guidage / onboarding | **Epic 12** — après friction recettes résolue |

**Hors scope** (inchangé) : journal alimentaire quotidien, comptes cloud, gamification culpabilisante, thème clair.

---

## Stratégie données — 3 phases (validées)

```
Phase 1 — OFFLINE (Epic 10)
  Ciqual FR (génériques officiels) + OpenNutrition embarqué (génériques + marques + barcode)
       ↓
Phase 2 — APIs MARQUES EU (Epic 11)
  Open Food Facts Search-a-licious + FoodRepo (complément) + cache local
       ↓
Phase 3 — USDA FDC (Epic 11, obligatoire)
  API FoodData Central — génériques EN + marques US/international en fallback
```

### Cascade de recherche unifiée (cible)

| Ordre | Source | Réseau | Usage principal |
|-------|--------|--------|-----------------|
| 1 | Mon catalogue | ❌ | Produits déjà importés |
| 2 | Bibliothèque Ciqual (offline) | ❌ | Ingrédients génériques FR (« œuf », « riz cuit ») |
| 3 | OpenNutrition (offline) | ❌ | Génériques + marques + barcode (~300k, subset embarqué) |
| 4 | Open Food Facts Search | ✅ | Marques rayon FR/EU en direct |
| 5 | FoodRepo API | ✅ | Marques CH/EU complément |
| 6 | USDA FoodData Central | ✅ | Génériques + marques fallback (clé utilisateur) |

À la sélection : **copie locale** dans `Product` / `ProductReference` — jamais de lien vivant vers l'API.

---

## Panorama des sources (génériques + marques)

### Retenues pour Nutrition

| Source | Type | Licence | Génériques | Marques | Barcode | France | Intégration |
|--------|------|---------|------------|---------|---------|--------|-------------|
| **Ciqual (ANSES)** | Fichier open data | Etalab 2.0 | ⭐⭐⭐ | ❌ | ❌ | ⭐⭐⭐ | Phase 1 — chunk lazy embarqué |
| **OpenNutrition** | TSV open data (~326k) | ODbL 1.0 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Phase 1 — chunk lazy (subset macros FR/EU) |
| **Open Food Facts** | API + export | ODbL | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Phase 2 — scan (existant) + Search-a-licious |
| **FoodRepo** | API REST | CC-BY 4.0 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ (surtout CH) | Phase 2 — provider complémentaire |
| **USDA FoodData Central** | API REST | Domaine public US | ⭐⭐⭐ | ⭐⭐ (US) | ⭐ | ⭐ (fallback) | Phase 3 — obligatoire |

### Évaluées et écartées (pour ce projet)

| Source | Raison d'écart |
|--------|----------------|
| **EuroFIR FoodEXplorer** | Pas d'API publique gratuite ; accès membres / payant |
| **Edamam / Nutritionix / Spoonacular** | Quotas commerciaux, clés exposées, ToS restrictifs |
| **FatSecret Platform** | OAuth + limites ; pas adapté PWA perso sans backend |
| **OpenNutrition DeepSearch** | Produit commercial live ; pas d'API libre documentée |
| **Scraping sites distributeurs** | Fragile, hors open data, risque légal |
| **GS1 / bases enseignes** | Fermées, pas d'accès gratuit |

### Notes marques France

- **OFF** reste la meilleure source live pour les rayons français (crowdsourcing actif, millions de produits EU).
- **OpenNutrition offline** comble le hors-ligne et les trous OFF (barcode + nom + marque pré-indexés).
- **FoodRepo** utile en complément (migros/COOP suisses, parfois produits EU) — pas prioritaire seul pour la France.
- **USDA Branded** couvre surtout le marché US ; pertinent en **fallback** quand OFF + OpenNutrition ne trouvent rien.

---

## Ordre d'implémentation epics

**E10 → E11 → E9 → E12**

---

## Requirements Inventory (post-MVP)

### Functional Requirements

FR-25: L'utilisateur peut rechercher et importer des aliments depuis une bibliothèque embarquée (Ciqual + OpenNutrition) offline.
FR-26: Lors de l'ajout d'un ingrédient recette, l'utilisateur peut rechercher en une fois : catalogue, bibliothèque offline, et (si réseau) APIs externes.
FR-27: L'import depuis une source externe crée un `Product` local (copie) avec macros/100 g — pas de référence distante vivante.
FR-28: L'utilisateur peut rechercher des produits par nom via Open Food Facts Search-a-licious (GET read-only).
FR-29: Les recherches API récentes sont mises en cache local (termes + résultats minimaux) pour réutilisation offline limitée.
FR-30: L'application conserve un thème sombre unique, enrichi d'une palette « nature » — pas de thème clair.
FR-31: Les empty states et l'iconographie catégorie renforcent l'identité visuelle sans animations distrayantes en Mode Courses.
FR-32: Un écran d'accueil présente les prochaines actions utiles en ≤ 2 taps.
FR-33: Un onboarding court guide la première recette avec ingrédients issus de la bibliothèque.
FR-34: L'utilisateur peut rechercher des aliments via USDA FoodData Central (clé api.data.gov configurable).
FR-35: L'utilisateur peut rechercher des produits marque via FoodRepo (clé optionnelle).
FR-36: L'utilisateur peut rechercher par barcode dans la bibliothèque OpenNutrition embarquée (offline).
FR-37: Chaque résultat affiche sa source (Ciqual, OpenNutrition, OFF, FoodRepo, USDA) avant import.
FR-38: L'écran À propos / Paramètres affiche les attributions licence (Ciqual Etalab, OpenNutrition ODbL, OFF ODbL, FoodRepo CC-BY, USDA).

### Non-Functional Requirements

NFR-13: Chunks offline `food-library-ciqual` + `food-library-opennutrition` : cible < 3 Mo gzip combinés (lazy-load).
NFR-14: Recherche type-ahead locale < 100 ms perçu sur index combiné ≤ 10k entrées actives en mémoire.
NFR-15: Recherche API : timeout 5 s, message explicite si offline ; debounce ≥ 400 ms, min 3 caractères.
NFR-16: Aucune donnée personnelle (garde-manger, plan) envoyée aux APIs — uniquement termes de recherche, codes-barres, clés API.
NFR-17: Contrastes WCAG AA conservés après refonte palette chaleureuse.
NFR-18: Mode Courses inchangé fonctionnellement.
NFR-19: OFF search ≤ 10 req/min — pas de search-as-you-type agressif ; bouton « Rechercher » en alternative.
NFR-20: USDA : 1 000 req/h par clé — cache IndexedDB des fiches importées.
NFR-21: Clés API (USDA, FoodRepo) stockées localement dans `appSettings` — jamais dans export backup par défaut.

### FR Coverage Map

FR-25, FR-26, FR-27, FR-36 → Epic 10
FR-26, FR-28, FR-29, FR-34, FR-35, FR-37, FR-38 → Epic 11
FR-30, FR-31 → Epic 9
FR-32, FR-33 → Epic 12

---

## Epic List

### Epic 10: Bibliothèque offline multi-sources (Phase 1) — priorité #1
L'utilisateur trouve ingrédients génériques et marques courantes offline via Ciqual + OpenNutrition.
**FRs couverts:** FR-25, FR-26, FR-27, FR-36, FR-37 (partiel)
**Phase:** 1

### Epic 11: Recherche multi-providers (Phases 2 + 3)
L'utilisateur complète sa recherche en ligne via OFF, FoodRepo et USDA FDC — avec cache et attributions.
**FRs couverts:** FR-26, FR-28, FR-29, FR-34, FR-35, FR-37, FR-38
**Phases:** 2 (OFF + FoodRepo) puis 3 (USDA obligatoire)
**Dépendances:** Epic 10 (architecture `FoodSearchService`)

### Epic 9: Identité visuelle sombre chaleureuse
**FRs couverts:** FR-30, FR-31

### Epic 12: Accueil intelligent et onboarding recette
**FRs couverts:** FR-32, FR-33

---

## Epic 10: Bibliothèque offline multi-sources (Phase 1)

### Story 10.1: Pipeline Ciqual → chunk `food-library-ciqual`

En tant que développeur,
Je veux convertir la table Ciqual ANSES en JSON embarqué,
Afin d'offrir des ingrédients génériques français officiels offline.

**Acceptance Criteria:**

**Given** le fichier source Ciqual (XML/XLS open data, licence Etalab 2.0)
**When** le script build `scripts/build-food-library-ciqual.ts` s'exécute
**Then** il produit `src/assets/food-library/ciqual-v{year}.json` avec ≥ 3 000 entrées
**And** chaque entrée : `id`, `nameFr`, `category`, `kcal`, `proteinG`, `fatG`, `carbsG`, `fiberG` per 100g, `aliases[]`
**And** `libraryVersion` et `source: 'ciqual'` dans le manifest
**And** chunk lazy < 1,5 Mo gzip (NFR-13)

### Story 10.2: Pipeline OpenNutrition → chunk `food-library-opennutrition`

En tant que développeur,
Je veux embarquer un subset OpenNutrition (génériques + marques + barcode),
Afin de couvrir les produits de marque offline.

**Acceptance Criteria:**

**Given** le TSV OpenNutrition (ODbL 1.0, opennutrition.app)
**When** le script build filtre entrées avec macros complètes (kcal, P, L, G)
**Then** il produit un JSON avec barcode optionnel, `brand`, `name`, macros/100g
**And** priorité entrées avec `country` FR/EU ou nom en français si filtre dispo
**And** cible 5 000–15 000 entrées les plus utiles (pas les 326k brutes — taille maîtrisée)
**And** chunk lazy < 2 Mo gzip (NFR-13)
**And** attribution ODbL documentée dans `DATA-SOURCES.md`

### Story 10.3: FoodSearchService — index local unifié

En tant qu'utilisateur,
Je veux chercher « œuf » ou « Danone skyr » dans les données offline,
Afin de trouver génériques et marques sans réseau.

**Acceptance Criteria:**

**Given** chunks Ciqual + OpenNutrition chargés (lazy)
**When** je recherche dans le picker produit
**Then** `FoodSearchService.searchLocal()` interroge les deux index en < 100 ms (NFR-14)
**And** résultats groupés : « Ciqual » puis « OpenNutrition » avec badge source (FR-37)
**And** recherche barcode offline via OpenNutrition index (FR-36)
**And** fonctionne 100 % offline (FR-25)

### Story 10.4: Importer vers mon catalogue

En tant qu'utilisateur,
Je veux ajouter un aliment de la bibliothèque à mon catalogue,
Afin de l'utiliser dans recettes et garde-manger.

**Acceptance Criteria:**

**Given** un hit Ciqual ou OpenNutrition sélectionné
**When** je confirme « Ajouter à mon catalogue »
**Then** un `Product` + `ProductReference` sont créés localement (FR-27)
**And** OpenNutrition avec barcode → ref avec barcode ; Ciqual sans barcode → ref « Générique »
**And** déduplication par barcode ou nom normalisé + proposition fusion
**And** `sourceProvider` + `sourceId` optionnels sur Product (traçabilité)

### Story 10.5: Recherche unifiée lors ajout ingrédient recette

En tant qu'utilisateur créant une recette,
Je veux un seul champ : catalogue + bibliothèque offline,
Afin d'ajouter « Œuf » en 2 taps.

**Acceptance Criteria:**

**Given** le formulaire ingrédient d'une RecipeVariant
**When** j'ouvre le picker produit (offline)
**Then** sections : « Mon catalogue » → « Ciqual » → « OpenNutrition » (FR-26)
**And** sélection bibliothèque → import auto (10.4) puis ajout ingrédient
**And** quantité grammes demandée après sélection

### Story 10.6: Import groupé pack démarrage

En tant qu'utilisateur,
Je veux importer les ~50 ingrédients de base en un tap,
Afin de préparer mon catalogue rapidement.

**Acceptance Criteria:**

**Given** l'écran Bibliothèque
**When** je choisis « Pack démarrage (50 bases) »
**Then** import depuis liste curatée Ciqual ; existants ignorés
**And** résumé « X ajoutés, Y déjà présents » ; idempotent

---

## Epic 11: Recherche multi-providers (Phases 2 + 3)

### Story 11.1: Provider OFF Search-a-licious (Phase 2)

En tant qu'utilisateur,
Je veux chercher « skyr danone » par nom en ligne,
Afin de trouver des marques françaises sans scanner.

**Acceptance Criteria:**

**Given** réseau disponible
**When** je recherche avec ≥ 3 caractères (debounce 400 ms)
**Then** `OffSearchProvider` appelle `search.openfoodfacts.org` avec `langs=fr` (FR-28)
**And** ≤ 10 req/min respecté — pas de requête à chaque frappe (NFR-19)
**And** tap résultat → même flow que scan barcode (prévisualisation → import)
**When** offline → section masquée, message + lien bibliothèque (NFR-15)

### Story 11.2: Provider FoodRepo (Phase 2, complément marques)

En tant qu'utilisateur,
Je veux élargir la recherche marques via FoodRepo,
Afin de trouver des produits absents d'OFF.

**Acceptance Criteria:**

**Given** clé FoodRepo configurée dans Paramètres (FR-35, NFR-21)
**When** recherche unifiée avec réseau et OFF < 5 résultats pertinents
**Then** `FoodRepoSearchProvider` interroge `foodrepo.org/api/v3/products/_search`
**And** résultats affichés section « FoodRepo » avec badge source
**And** import crée ProductReference avec barcode si présent
**When** pas de clé → section masquée, lien « Configurer FoodRepo » dans Paramètres

### Story 11.3: Provider USDA FoodData Central (Phase 3 — obligatoire)

En tant qu'utilisateur,
Je veux chercher des aliments via USDA quand les sources EU échouent,
Afin de couvrir génériques et marques internationales.

**Acceptance Criteria:**

**Given** clé USDA (api.data.gov) dans Paramètres — obligatoire pour activer Phase 3 (FR-34)
**When** je recherche et sections locales + OFF + FoodRepo insuffisantes
**Then** `UsdaFdcSearchProvider` appelle `/fdc/v1/foods/search` avec `dataType=Foundation,SR Legacy,Branded`
**And** mapping nutriments USDA → champs app (kcal, P, L, G, fibres)
**And** alias FR courants → terme EN (« œuf » → « egg ») via table embarquée `fr-en-food-aliases.json`
**And** résultats section « USDA » ; import copie locale (FR-27)
**And** cache IndexedDB des fiches USDA importées (NFR-20)
**When** pas de clé → bannière Paramètres « Ajoutez votre clé USDA gratuite »

### Story 11.4: Recherche unifiée cascade (toutes phases)

En tant qu'utilisateur,
Je veux un seul champ partout avec toutes les sources,
Afin de ne pas choisir manuellement.

**Acceptance Criteria:**

**Given** le picker produit (recette, garde-manger, catalogue)
**When** je recherche
**Then** ordre : Catalogue → Ciqual → OpenNutrition → (online) OFF → FoodRepo → USDA (FR-26)
**And** chaque section affiche badge source + spinner indépendant
**And** sections online masquées si offline
**And** bouton explicite « Rechercher en ligne » si debounce insuffisant (NFR-19)

### Story 11.5: Cache local recherches API

En tant qu'utilisateur,
Je veux retrouver mes recherches récentes,
Afin de ré-importer sans rappel API.

**Acceptance Criteria:**

**Given** recherches OFF / FoodRepo / USDA réussies
**When** je rouvre la recherche
**Then** 30 derniers hits en IndexedDB `searchCache` (FR-29)
**And** TTL 30 jours ; pas de données garde-manger/plan
**And** « Effacer historique recherche » dans Paramètres

### Story 11.6: Paramètres clés API et attributions

En tant qu'utilisateur,
Je veux configurer mes clés et voir les licences des données,
Afin de respecter les sources et activer USDA/FoodRepo.

**Acceptance Criteria:**

**Given** Paramètres → Sources de données
**When** j'affiche l'écran
**Then** champs : clé USDA (requis Phase 3), clé FoodRepo (optionnel) — stockage local `appSettings` (NFR-21)
**And** liens inscription gratuite api.data.gov et foodrepo.org
**And** section Attributions : Ciqual (Etalab), OpenNutrition (ODbL), OFF (ODbL), FoodRepo (CC-BY), USDA (domaine public) (FR-38)
**And** clés API exclues de l'export backup par défaut

---

## Epic 9: Identité visuelle sombre chaleureuse

### Story 9.1: Palette « forêt » sur fond sombre

**Acceptance Criteria:** (inchangé — voir version précédente)

### Story 9.2: Iconographie catégories alimentaires

**Acceptance Criteria:** (inchangé)

### Story 9.3: Empty states et micro-copy chaleureuxs

**Acceptance Criteria:** (inchangé)

---

## Epic 12: Accueil intelligent et onboarding recette

### Story 12.1: Tableau de bord d'accueil

**Acceptance Criteria:** (inchangé)

### Story 12.2: Onboarding première recette (3 étapes)

**Acceptance Criteria:** (inchangé — étape 2 inclut import pack Ciqual)

### Story 12.3: Raccourcis contextuels cross-surfaces

**Acceptance Criteria:** (inchangé)

---

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Taille bundle offline trop lourde | Subset OpenNutrition curaté ; lazy chunks séparés |
| Qualité OpenNutrition (IA) sur marques | Afficher source ; préférer OFF live quand réseau dispo |
| Rate limits OFF / USDA | Debounce, cache, bouton recherche explicite |
| Clé USDA exposée dans client | Acceptable app perso ; doc utilisateur ; pas dans export |
| Dérive clone MyFitnessPal | Import catalogue uniquement ; pas de log journalier |
| Licence ODbL OpenNutrition | Attribution dans app ; partage améliorations si DB dérivée distribuée |

## Métriques de succès

| Signal | Cible |
|--------|-------|
| Création recette 5 ingrédients | < 3 min |
| Recherche « œuf » offline → ingrédient | ≤ 4 interactions |
| Recherche marque « skyr » avec réseau | trouvée via OFF ou OpenNutrition dans ≥ 80 % cas test |
| Couverture barcode offline | ≥ 50 % codes test FR trouvés dans OpenNutrition embarqué |
