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
---

# Nutrition — Epics post-MVP

## Contexte et décisions verrouillées

Le MVP (Epics 1–8) couvre le parcours courses-cuisine-planification. Le retour utilisateur identifie trois manques :

| Besoin exprimé | Décision produit |
|----------------|------------------|
| Saisie pénible des ingrédients / macros en recette | **Epic 10** en priorité absolue |
| Recherche type MyFitnessPal (« œuf », « skyr ») | **Epic 10** (local) + **Epic 11** (OFF texte) — les deux contextes |
| App trop sobre | **Epic 9** — sombre chaleureux, pas de bascule clair/sombre |
| Guidage / onboarding | **Epic 12** — après friction recettes résolue |

**Hors scope** (inchangé) : journal alimentaire quotidien, comptes cloud, gamification culpabilisante, thème clair.

## Ordre d'implémentation recommandé

**E10 → E11 → E9 → E12**

---

## Requirements Inventory (post-MVP)

### Functional Requirements

FR-25: L'utilisateur peut rechercher et importer des aliments génériques depuis une bibliothèque embarquée (offline) vers son catalogue personnel.
FR-26: Lors de l'ajout d'un ingrédient recette, l'utilisateur peut rechercher en une fois : son catalogue, la bibliothèque embarquée, et (si réseau) Open Food Facts.
FR-27: L'import depuis la bibliothèque crée un `Product` local (copie) avec macros/100 g pré-remplies — pas de référence distante vivante.
FR-28: L'utilisateur peut rechercher des produits par nom via Open Food Facts (GET read-only) en complément du scan barcode.
FR-29: Les recherches OFF récentes sont mises en cache local (termes + résultats minimaux) pour réutilisation offline limitée.
FR-30: L'application conserve un thème sombre unique, enrichi d'une palette « nature » (verts mousse, terre cuite, crème) — pas de thème clair.
FR-31: Les empty states et l'iconographie catégorie renforcent l'identité visuelle sans animations distrayantes en Mode Courses.
FR-32: Un écran d'accueil présente les prochaines actions utiles (plan, courses, DLC, export) en ≤ 2 taps.
FR-33: Un onboarding court guide la première recette avec ingrédients issus de la bibliothèque.

### Non-Functional Requirements

NFR-13: La bibliothèque embarquée ajoute < 500 Ko au bundle PWA (hors lazy-load chunk dédié).
NFR-14: Recherche type-ahead bibliothèque + catalogue local < 100 ms perçu sur 500 entrées.
NFR-15: Recherche OFF texte : timeout 5 s, message explicite si offline.
NFR-16: Aucune donnée personnelle (garde-manger, plan) envoyée à OFF — uniquement termes de recherche et codes-barres.
NFR-17: Contrastes WCAG AA conservés après refonte palette chaleureuse.
NFR-18: Mode Courses inchangé fonctionnellement — pas d'illustrations animées ni confettis.

### FR Coverage Map

FR-25, FR-26, FR-27 → Epic 10
FR-26, FR-28, FR-29 → Epic 11
FR-30, FR-31 → Epic 9
FR-32, FR-33 → Epic 12

---

## Epic List

### Epic 10: Bibliothèque d'aliments de base (priorité #1)
L'utilisateur ajoute des ingrédients courants à ses recettes en quelques secondes, sans saisir manuellement les macros de chaque aliment générique.
**FRs couverts:** FR-25, FR-26, FR-27
**Dépendances:** Epic 4 (recettes) terminé

### Epic 11: Recherche produit enrichie (OFF + cache)
L'utilisateur trouve un produit par nom à la maison ou en magasin, en complément du scan barcode.
**FRs couverts:** FR-26, FR-28, FR-29
**Dépendances:** Epic 10 (recherche unifiée UX)

### Epic 9: Identité visuelle sombre chaleureuse
L'application garde un thème sombre unique mais plus accueillant — palette nature, iconographie, empty states vivants.
**FRs couverts:** FR-30, FR-31
**Dépendances:** aucune (peut être parallélisé après E10)

### Epic 12: Accueil intelligent et onboarding recette
L'utilisateur sait quoi faire à l'ouverture et atteint sa première recette planifiée sans doc externe.
**FRs couverts:** FR-32, FR-33
**Dépendances:** Epic 10 (onboarding s'appuie sur bibliothèque)

---

## Epic 10: Bibliothèque d'aliments de base

### Story 10.1: Pack embarqué d'ingrédients génériques FR

En tant qu'utilisateur,
Je veux disposer d'une bibliothèque locale d'aliments courants avec macros/100 g,
Afin de ne pas tout créer à la main.

**Acceptance Criteria:**

**Given** l'application installée
**When** le chunk `food-library` est chargé (lazy)
**Then** il contient ≥ 200 entrées `FoodLibraryItem` (id, nameFr, category, kcal, proteinG, fatG, carbsG, fiberG per 100g, optional aliases[])
**And** les données proviennent d'une source ouverte documentée (seed custom ou dérivé Ciqual — pas d'API runtime)
**And** le pack est versionné (`libraryVersion`) pour migrations futures
**And** taille bundle chunk < 500 Ko gzip (NFR-13)

### Story 10.2: Parcourir et rechercher la bibliothèque

En tant qu'utilisateur,
Je veux rechercher « œuf » ou « blanc de poulet » dans la bibliothèque,
Afin de trouver rapidement un aliment générique.

**Acceptance Criteria:**

**Given** l'écran « Bibliothèque » accessible depuis Produits ou ajout ingrédient
**When** je saisis une recherche
**Then** les résultats filtrent par nom et alias en < 100 ms perçu (NFR-14)
**And** chaque ligne affiche nom, catégorie, macros résumé/100 g
**And** fonctionne 100 % offline (FR-25)
**And** tri par pertinence puis nom alphabétique

### Story 10.3: Importer vers mon catalogue

En tant qu'utilisateur,
Je veux ajouter un aliment de la bibliothèque à mon catalogue personnel,
Afin de l'utiliser dans recettes et garde-manger.

**Acceptance Criteria:**

**Given** un `FoodLibraryItem` sélectionné
**When** je confirme « Ajouter à mon catalogue »
**Then** un `Product` est créé localement avec nom, catégorie, macros via `preferredReferenceId` ou ref synthétique « Générique » (FR-27)
**And** si un Product du même nom existe déjà, bottom sheet propose fusion ou création distincte
**And** l'import ne crée pas de lien vivant vers la bibliothèque — copie autonome
**And** `sourceLibraryId` optionnel sur Product pour traçabilité debug uniquement

### Story 10.4: Recherche unifiée lors ajout ingrédient recette

En tant qu'utilisateur créant une recette,
Je veux chercher dans mon catalogue ET la bibliothèque en un seul champ,
Afin d'ajouter « Œuf » en 2 taps.

**Acceptance Criteria:**

**Given** le formulaire ingrédient d'une RecipeVariant
**When** j'ouvre le picker produit
**Then** une recherche unifiée affiche sections « Mon catalogue » puis « Bibliothèque » (FR-26)
**And** sélection bibliothèque → import automatique puis ajout ingrédient (enchaîne 10.3)
**And** sélection catalogue → ajout direct si `preferredReferenceId` défini
**And** Product sans ref préférée → bandeau actionnable avant validation
**And** quantité en grammes demandée après sélection produit

### Story 10.5: Import groupé des bases cuisine

En tant qu'utilisateur,
Je veux importer d'un coup les ~50 ingrédients les plus courants,
Afin de préparer mon catalogue pour la plupart de mes recettes.

**Acceptance Criteria:**

**Given** l'écran Bibliothèque
**When** je choisis « Pack démarrage (50 bases) »
**Then** les Products manquants sont créés en bulk ; existants ignorés (pas d'écrasement)
**And** résumé « X ajoutés, Y déjà présents »
**And** opération idempotente (relancer ne duplique pas)

---

## Epic 11: Recherche produit enrichie (OFF + cache)

### Story 11.1: Recherche texte Open Food Facts

En tant qu'utilisateur,
Je veux chercher « skyr danone » ou « avoine » par nom,
Afin de trouver un produit sans scanner le code-barres.

**Acceptance Criteria:**

**Given** réseau disponible
**When** je recherche dans l'onglet Produits (champ dédié ou mode recherche étendu)
**Then** `OffApiService` appelle GET search OFF (endpoint documenté, read-only) (FR-28, NFR-16)
**And** résultats affichent nom, marque, macros/100 g si disponibles
**And** tap résultat → même flow que scan (prévisualisation → rattacher Product ou créer)
**When** offline
**Then** message « Recherche indisponible hors ligne — essayez la bibliothèque » + lien Bibliothèque (NFR-15)

### Story 11.2: Intégration recherche unifiée (catalogue + bibliothèque + OFF)

En tant qu'utilisateur,
Je veux un seul champ de recherche produit partout,
Afin de ne pas choisir la source manuellement.

**Acceptance Criteria:**

**Given** le picker produit (recette, garde-manger, catalogue)
**When** je recherche avec réseau
**Then** sections ordonnées : Mon catalogue → Bibliothèque → Open Food Facts (FR-26)
**And** debounce 300 ms sur appel OFF
**When** offline
**Then** sections OFF masquée ; catalogue + bibliothèque seuls

### Story 11.3: Cache local recherches récentes

En tant qu'utilisateur,
Je veux retrouver mes dernières recherches produit,
Afin de ré-ajouter rapidement un article déjà trouvé.

**Acceptance Criteria:**

**Given** des recherches OFF réussies
**When** je rouvre la recherche (même session ou après redémarrage)
**Then** les 20 derniers termes + résultats minimaux sont en IndexedDB `searchCache` (FR-29)
**And** TTL 30 jours ; pas de données garde-manger/plan dans ce cache
**And** bouton « Effacer l'historique recherche » dans Paramètres

---

## Epic 9: Identité visuelle sombre chaleureuse

### Story 9.1: Palette « forêt » sur fond sombre

En tant qu'utilisateur,
Je veux une interface sombre mais chaleureuse,
Afin que l'app soit agréable au quotidien sans perdre le confort magasin.

**Acceptance Criteria:**

**Given** `DESIGN.md` mis à jour
**When** l'app s'affiche
**Then** fond reste sombre (`surface-base` ≈ `#121212`–`#1A1F1A`) avec teinte verte subtile (FR-30)
**And** accents : vert mousse `#8FBC8F`, terre cuite `#C4A77D`, crème `#E8E0D4` pour titres/empty states
**And** `accent-positive` et barres macro `met` alignés sur la nouvelle palette
**And** contrastes WCAG AA vérifiés (NFR-17)
**And** **pas** de thème clair ni toggle clair/sombre au MVP post-MVP

### Story 9.2: Iconographie catégories alimentaires

En tant qu'utilisateur,
Je veux reconnaître visuellement les types d'aliments,
Afin de parcourir catalogue et bibliothèque plus intuitivement.

**Acceptance Criteria:**

**Given** un Product ou FoodLibraryItem avec `category`
**When** affiché en liste ou carte
**Then** une icône catégorie cohérente s'affiche (légumes, viande, laitiers, féculents, etc.) (FR-31)
**And** style ligne simple / monochrome teinté — pas de photo réaliste lourde
**And** `aria-hidden` sur icône + label catégorie textuel pour accessibilité

### Story 9.3: Empty states et micro-copy chaleureuxs

En tant qu'utilisateur,
Je veux des écrans vides qui m'orientent sans être froids,
Afin de savoir quoi faire ensuite.

**Acceptance Criteria:**

**Given** une liste vide (recettes, produits, garde-manger, plan)
**When** l'écran s'affiche
**Then** `EmptyState` inclut illustration SVG légère thème nature (FR-31)
**And** ton orientant, pas culpabilisant (« Ajoutez votre première recette » vs « Vous n'avez rien fait »)
**And** CTA contextuel vers Bibliothèque ou création
**And** Mode Courses : empty states inchangés (minimal, pas d'illustration) (NFR-18)

---

## Epic 12: Accueil intelligent et onboarding recette

### Story 12.1: Tableau de bord d'accueil

En tant qu'utilisateur,
Je veux voir mes prochaines actions utiles à l'ouverture,
Afin de ne pas naviguer au hasard entre 5 onglets.

**Acceptance Criteria:**

**Given** cold start ou tap logo/accueil
**When** le tableau de bord s'affiche
**Then** cartes actionnables : repas planifiés aujourd'hui, articles courses restants, produits DLC ≤ 3 jours, rappel export si applicable (FR-32)
**And** chaque carte mène à la surface en ≤ 2 taps
**And** option « Masquer l'accueil au démarrage » dans Paramètres (défaut : afficher si onboarding incomplet)

### Story 12.2: Onboarding première recette (3 étapes)

En tant que nouvel utilisateur,
Je veux être guidé jusqu'à une recette avec ingrédients de la bibliothèque,
Afin de comprendre la valeur de l'app rapidement.

**Acceptance Criteria:**

**Given** première ouverture (`onboardingCompleted: false`)
**When** l'onboarding démarre
**Then** étape 1 : objectifs macros optionnels (skip autorisé)
**And** étape 2 : import pack 50 bases ou parcours bibliothèque
**And** étape 3 : créer une recette simple (template « Omelette » suggéré) avec ingrédients bibliothèque (FR-33)
**And** complétion pose `onboardingCompleted: true`
**And** relançable depuis Paramètres

### Story 12.3: Raccourcis contextuels cross-surfaces

En tant qu'utilisateur,
Je veux des actions rapides depuis les cartes produit et recette,
Afin de réduire les allers-retours entre onglets.

**Acceptance Criteria:**

**Given** une ProductCard ou fiche recette
**When** j'ouvre le menu rapide (long-press ou ⋮)
**Then** actions : « Ajouter au garde-manger », « Utiliser dans une recette », « Ajouter à la liste manuelle »
**And** chaque action ouvre le bottom sheet minimal sans quitter le contexte

---

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Dérive vers clone MyFitnessPal | Bibliothèque = import catalogue uniquement ; pas de log consommation journalière |
| Qualité données OFF recherche texte | Bibliothèque locale prioritaire ; OFF en section secondaire |
| Bundle trop lourd | Chunk lazy `food-library` ; pas d'images dans le pack |
| Refonte visuelle casse Mode Courses | Story 9.3 exclut Mode Courses ; revue contrastes dédiée |
| Duplication Products (biblio + OFF + scan) | Détection nom normalisé + proposition fusion à l'import |

## Métriques de succès (qualitatives)

| Signal | Cible |
|--------|-------|
| Temps création recette 5 ingrédients | < 3 min (vs saisie manuelle actuelle) |
| % ingrédients issus bibliothèque | ≥ 60 % sur nouvelles recettes |
| Recherche « œuf » → ingrédient ajouté | ≤ 4 interactions |
| Satisfaction visuelle | Subjectif — app « moins outil », toujours lisible en magasin |
