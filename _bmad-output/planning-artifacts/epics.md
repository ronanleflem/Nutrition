---
stepsCompleted: [step-01, step-02, step-03, step-04]
inputDocuments:
  - planning-artifacts/prds/prd-Nutrition-2026-08-30/prd.md
  - planning-artifacts/prds/prd-Nutrition-2026-08-30/addendum.md
  - planning-artifacts/architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md
  - planning-artifacts/architecture/architecture-Nutrition-2026-08-30/SOLUTION-DESIGN.md
  - specs/spec-nutrition/SPEC.md
  - specs/spec-nutrition/data-model.md
  - planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md
  - planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md
  - project-context.md
---

# Nutrition - Epic Breakdown

## Overview

Ce document décompose les exigences du PRD, de l'architecture spine, du SPEC et du contrat UX en epics et stories implémentables pour le MVP Nutrition — PWA Angular local-first.

**Ordre d'implémentation recommandé :** E1 → E2 → E3 → E4 → E6 → E7 → E5 → E8

## Requirements Inventory

### Functional Requirements

FR-1: L'utilisateur peut installer Nutrition sur l'écran d'accueil et l'ouvrir en plein écran (PWA standalone).
FR-2: L'application s'affiche en thème sombre à la première ouverture avec contraste ≥ 4.5:1.
FR-3: Toutes les entités métier sont persistées dans IndexedDB sans serveur applicatif.
FR-4: L'utilisateur accède aux surfaces Garde-manger, Produits, Recettes, Plan, Courses, Objectifs, Paramètres en ≤ 2 interactions.
FR-5: L'utilisateur peut créer un Product générique avec nom, catégorie, priorité, notes.
FR-6: L'utilisateur peut éditer ou archiver (soft delete) un Product ; restaurer depuis Paramètres ; recréation barcode → restauration proposée.
FR-7: L'utilisateur peut scanner un code-barres EAN via caméra ou saisir le code manuellement en repli.
FR-8: L'utilisateur peut enrichir une ProductReference via Open Food Facts (GET read-only) et corriger avant sauvegarde.
FR-9: L'utilisateur peut ajouter un Product actif au garde-manger avec quantité en grammes, DLC et emplacement optionnels.
FR-10: L'utilisateur peut consulter et modifier le stock ; quantité 0 supprime la ligne automatiquement.
FR-11: L'utilisateur voit un indicateur visuel pour les lignes dont la DLC est dans les 3 jours.
FR-12: L'utilisateur crée une Recipe famille avec étapes, durée, portions, tags et au moins une RecipeVariant.
FR-13: L'application calcule et affiche les macros totales et par portion d'une variante (via preferredReference des ingrédients).
FR-14: L'utilisateur peut éditer ou supprimer une Recipe ; suppression retire les entrées Plan associées (avec confirmation).
FR-15: L'utilisateur définit ses objectifs macros journaliers (kcal, P, L, G, fibres) ; champs vides autorisés.
FR-16: Pour chaque jour planifié, l'utilisateur voit le total macros des variantes résolues et l'écart vs objectifs.
FR-17: L'utilisateur assigne une Recipe à une date et un créneau (petit-déj / déj / dîner) ; une seule recette par créneau.
FR-18: Depuis le Plan, l'utilisateur accède à la Synthèse Macros du jour sélectionné.
FR-19: L'utilisateur génère une Liste de Courses à partir du Plan et du Garde-manger (variantes résolues, agrégation par productId).
FR-20: L'utilisateur ajoute, modifie, supprime ou coche des items ; régénération préserve les items manuels.
FR-21: L'utilisateur active le Mode Courses plein écran (touch ≥ 44px, offline, thème sombre).
FR-22: L'utilisateur exporte toutes les entités en JSON versionné avec chiffrement AES-GCM optionnel.
FR-23: L'utilisateur importe avec mode Remplacer tout ou Fusionner selon règles PRD §10.
FR-24: L'application affiche un rappel discret si aucun export depuis 30 jours.

### NonFunctional Requirements

NFR-1: First Contentful Paint < 3 s sur mobile milieu de gamme (4G).
NFR-2: Interactions CRUD locales < 200 ms perçu.
NFR-3: Génération Liste de Courses < 2 s pour un plan de 21 repas.
NFR-4: Aucune donnée utilisateur envoyée à un tiers sauf code-barres vers OFF (lecture seule).
NFR-5: Pas de télémétrie analytics tiers au MVP.
NFR-6: Export chiffré recommandé par défaut dans l'UI.
NFR-7: Contrastes WCAG AA en thème sombre ; labels sur tous les champs formulaire.
NFR-8: Garde-manger, Recettes, Plan, Liste, Mode Courses fonctionnels offline.
NFR-9: Lookup OFF nécessite réseau ; message explicite si offline.
NFR-10: Cible principale Android Chrome PWA ; iOS Safari repli saisie manuelle obligatoire pour produits.
NFR-11: Interface entièrement en français.
NFR-12: Unités grammes uniquement ; macros normalisées pour 100 g sur références.

### Additional Requirements

- AR-1: Scaffold Angular 22.1.4 PWA standalone (pas de starter template externe — `ng new` + `@angular/service-worker`).
- AR-2: Seul `DatabaseService` (core) accède à Dexie/IndexedDB — AD-2.
- AR-3: Modèle catalogue deux niveaux : `Product` (générique) + `ProductReference` (SKU enseigne) — AD-3.
- AR-4: `pantryItems`, `recipeIngredients`, `shoppingListItems` lient `productId` uniquement — AD-4.
- AR-5: Macros canoniques via `Product.preferredReferenceId` — AD-5.
- AR-6: `ProductReference.nutritionalScore` persisté, recalculé au save via `NutritionalScoreService` — AD-6.
- AR-7: Enseigne principale = store de `preferredReferenceId` ; `recommendedStores[]` ordonné — AD-7.
- AR-8: `OffApiService` GET uniquement, cache mémoire session — AD-8.
- AR-9: Barcode sur `ProductReference` ; scan ref archivée → restauration — AD-9.
- AR-10: `BackupService` export `schemaVersion` + toutes tables MVP ; AES-GCM Web Crypto — AD-10.
- AR-11: Quantités en `quantityG` grammes uniquement — AD-11.
- AR-12: `appSettings.theme` défaut `dark` ; Mode Courses sans animations distrayantes — AD-12.
- AR-13: `Recipe` + `RecipeVariant` + `recipeIngredients.variantId` ; `defaultVariantId` obligatoire — AD-13.
- AR-14: `mealPlanEntries.recipeVariantId` nullable ; variante résolue = entry ou default ; cook met à jour — AD-14.
- AR-15: `RecipeVariant.rating` 1–5 ; pas de score nutritionnel auto sur recette — AD-15.
- AR-16: Feature folders lazy : `products`, `pantry`, `recipes`, `meal-plan`, `shopping-list`, `macro-goals`, `settings`.
- AR-17: IDs `crypto.randomUUID()` ; dates ISO 8601 UTC ; soft delete `deletedAt`.
- AR-18: Export JSON inclut `products`, `productReferences`, `recipes`, `recipeVariants`, `recipeIngredients`, et tables existantes.

### UX Design Requirements

UX-DR1: Bottom nav 5 onglets (Garde-manger, Produits, Recettes, Plan, Courses) + engrenage Paramètres sur tous les écrans.
UX-DR2: Tokens visuels `DESIGN.md` : surface `#121212`, accent sauge `#7CB87C`, system font stack.
UX-DR3: Liste catalogue = Products uniquement ; détail = références triées score ↓ ; enseigne principale = preferredReference.
UX-DR4: FAB scan 56px sur écran Produits, ouvre scanner plein écran.
UX-DR5: Composants `ProductCard`, `ReferenceRow`, badge « Préférée », pastille priorité avec aria-label.
UX-DR6: `WeekGrid` plan semaine 7×3 créneaux ; placeholder « + » ; chip variante sur créneau rempli.
UX-DR7: `VariantChipRow` scroll horizontal pour choix variante (plan ou cook).
UX-DR8: `MacroBarGroup` 5 barres (kcal, P, L, G, fibres) avec états under/met/over.
UX-DR9: Mode Courses masque nav/FAB ; header compteur « X restants » + bouton Terminer.
UX-DR10: `ShoppingRow` touch 52px ; tap zone gauche = toggle ; badge « manuel ».
UX-DR11: `EmptyState` sur listes vides avec CTA contextuel.
UX-DR12: Accessibilité : contrôles ≥ 44px (52px Mode Courses), aria sur barres macro et checkboxes, `prefers-reduced-motion`.
UX-DR13: iOS : bouton « Saisir le code » en premier plan (pas de scan caméra).
UX-DR14: `RegenerateBanner` quand plan modifié ; régénération préserve items manual.
UX-DR15: Bandeau « Choisir une référence pour les macros » si `preferredReferenceId` absent.

### FR Coverage Map

FR-1: Epic 1 — Installation PWA
FR-2: Epic 1 — Thème sombre par défaut
FR-3: Epic 1 — IndexedDB via DatabaseService
FR-4: Epic 1 — Navigation bottom nav 5 onglets
FR-5: Epic 2 — CRUD Product générique
FR-6: Epic 2 — Soft delete / restauration Product
FR-7: Epic 2 — Scanner barcode + saisie manuelle
FR-8: Epic 2 — Enrichissement OFF → ProductReference
FR-9: Epic 3 — Ajout au garde-manger
FR-10: Epic 3 — Consultation / modification stock
FR-11: Epic 3 — Alertes DLC
FR-12: Epic 4 — CRUD Recipe + RecipeVariant
FR-13: Epic 4 — Calcul macros variante / portion
FR-14: Epic 4 — Édition / suppression Recipe
FR-15: Epic 5 — Objectifs macros journaliers
FR-16: Epic 5 — Synthèse macros journalière
FR-17: Epic 6 — Assignation recette à créneau
FR-18: Epic 6 — Accès synthèse depuis Plan
FR-19: Epic 7 — Génération liste auto
FR-20: Epic 7 — Édition manuelle + régénération
FR-21: Epic 7 — Mode Courses plein écran
FR-22: Epic 8 — Export JSON chiffré
FR-23: Epic 8 — Import remplacer / fusionner
FR-24: Epic 8 — Rappel backup 30 jours

## Epic List

### Epic 1: Fondations PWA et navigation
L'utilisateur installe une PWA Angular mobile-first en français, avec thème sombre, stockage local et navigation vers toutes les surfaces en ≤ 2 taps.
**FRs couverts:** FR-1, FR-2, FR-3, FR-4
**UX-DRs:** UX-DR1, UX-DR2, UX-DR12

### Epic 2: Catalogue produit deux niveaux et scan
L'utilisateur gère un catalogue Product (générique) et ProductReference (enseigne/macros), scanne des codes-barres, enrichit via OFF et trie par score nutritionnel.
**FRs couverts:** FR-5, FR-6, FR-7, FR-8
**UX-DRs:** UX-DR3, UX-DR4, UX-DR5, UX-DR13, UX-DR15

### Epic 3: Garde-manger
L'utilisateur suit son stock domestique en grammes avec alertes DLC.
**FRs couverts:** FR-9, FR-10, FR-11
**UX-DRs:** UX-DR11

### Epic 4: Recettes familles et variantes
L'utilisateur crée des recettes avec variantes (substitution/scale), note les variantes en étoiles et consulte les macros par portion.
**FRs couverts:** FR-12, FR-13, FR-14
**UX-DRs:** UX-DR7, UX-DR11

### Epic 5: Objectifs macros et synthèse
L'utilisateur définit ses cibles journalières et compare la synthèse du plan du jour (variantes résolues).
**FRs couverts:** FR-15, FR-16
**UX-DRs:** UX-DR8

### Epic 6: Plan de repas et choix variante
L'utilisateur planifie une recette par créneau/jour et choisit la variante au plan ou au cook.
**FRs couverts:** FR-17, FR-18
**UX-DRs:** UX-DR6, UX-DR7

### Epic 7: Liste de courses et mode magasin
L'utilisateur génère et édite sa liste depuis plan − garde-manger, avec mode courses plein écran offline.
**FRs couverts:** FR-19, FR-20, FR-21
**UX-DRs:** UX-DR9, UX-DR10, UX-DR14

### Epic 8: Sauvegarde et restauration
L'utilisateur exporte et importe toutes ses données avec backup chiffré optionnel.
**FRs couverts:** FR-22, FR-23, FR-24

---

## Epic 1: Fondations PWA et navigation

L'utilisateur installe une PWA Angular mobile-first en français, avec thème sombre, stockage local et navigation vers toutes les surfaces.

### Story 1.1: Scaffold Angular PWA et routing lazy

En tant que développeur-propriétaire,
Je veux un projet Angular 22 PWA avec routes lazy par feature,
Afin de disposer d'une base installable et extensible.

**Acceptance Criteria:**

**Given** un dépôt vide ou initialisé
**When** je lance l'application via `ng serve`
**Then** le manifest PWA est valide (nom Nutrition, icônes, `display: standalone`)
**And** les routes lazy existent pour `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`, `/goals`, `/settings` (composants placeholder)
**And** l'application démarre sans erreur (FR-1, AR-1, AR-16)

### Story 1.2: DatabaseService et schéma Dexie initial

En tant qu'utilisateur,
Je veux que mes paramètres et données persistent localement,
Afin de retrouver l'application à l'état où je l'ai laissée.

**Acceptance Criteria:**

**Given** l'application démarre pour la première fois
**When** Dexie s'initialise via `DatabaseService` uniquement (AR-2)
**Then** la table `appSettings` existe avec singleton `theme: 'dark'` par défaut (FR-3, AR-12)
**And** fermer et rouvrir l'app conserve `appSettings` sans appel réseau (FR-3, NFR-8)
**And** aucune feature n'importe Dexie directement

### Story 1.3: Thème sombre et shell navigation

En tant qu'utilisateur,
Je veux une interface sombre avec navigation par le bas,
Afin d'utiliser l'app confortablement en magasin et au pouce.

**Acceptance Criteria:**

**Given** la première ouverture de l'application
**When** le shell layout s'affiche
**Then** le fond principal est `{colors.surface-base}` (#121212) et le texte est contrasté ≥ 4.5:1 (FR-2, UX-DR2, NFR-7)
**And** la bottom nav affiche 5 onglets avec labels français (Garde-manger, Produits, Recettes, Plan, Courses) (FR-4, UX-DR1)
**And** l'icône engrenage ouvre `/settings` depuis tout écran (UX-DR1)
**And** chaque surface placeholder est atteignable en ≤ 2 taps (FR-4)
**And** tous les textes UI sont en français (NFR-11)

### Story 1.4: Service Worker shell offline

En tant qu'utilisateur,
Je veux que le shell de l'application fonctionne hors ligne,
Afin d'accéder aux parcours critiques sans réseau.

**Acceptance Criteria:**

**Given** l'app installée et visitée au moins une fois en ligne
**When** le réseau est coupé et je relance l'app
**Then** le shell, les assets et la navigation entre onglets fonctionnent (NFR-8)
**And** le service worker ne cache pas les réponses OFF (AR-8)
**And** FCP reste < 3 s sur mobile milieu de gamme en conditions normales (NFR-1)

---

## Epic 2: Catalogue produit deux niveaux et scan

L'utilisateur gère Product + ProductReference, scanne et enrichit via OFF.

### Story 2.1: CRUD Product générique

En tant qu'utilisateur,
Je veux créer et éditer des produits génériques (nom, catégorie, priorité, notes),
Afin de structurer mon catalogue alimentaire.

**Acceptance Criteria:**

**Given** je suis sur l'onglet Produits
**When** je crée un Product avec nom obligatoire et champs optionnels (category, priority green/yellow/gray, notes)
**Then** le Product apparaît dans la liste triée par score de sa ref préférée (ou nom si pas de ref) (FR-5, AR-3)
**And** la table `products` est créée dans Dexie via `DatabaseService` (AR-2, AR-17)
**And** la liste affiche uniquement des Products actifs (`deletedAt == null`) (FR-6)
**And** pastille priorité a un `aria-label` textuel (UX-DR5, UX-DR12)

### Story 2.2: CRUD ProductReference et référence préférée

En tant qu'utilisateur,
Je veux ajouter des références enseigne avec macros et score nutritionnel,
Afin de comparer les marques et calculer mes recettes.

**Acceptance Criteria:**

**Given** un Product existant
**When** je crée une ProductReference (store, label, macros/100g en grammes, barcode optionnel)
**Then** `NutritionalScoreService` calcule et persiste `nutritionalScore` (AR-6)
**And** je peux définir `preferredReferenceId` sur le Product (AR-5, UX-DR15)
**And** si aucune ref préférée, un bandeau « Choisir une référence pour les macros » s'affiche (UX-DR15)
**And** la table `productReferences` est créée avec index `productId`, `barcode`, `nutritionalScore`, `store` (AR-3)
**And** l'enseigne principale affichée = store de la ref préférée (AR-7, UX-DR3)
**And** `recommendedStores[]` est ordonné ; défaut = stores des refs triées score ↓ (AR-7)

### Story 2.3: Liste catalogue recherche et tri

En tant qu'utilisateur,
Je veux rechercher et trier mon catalogue par score,
Afin de trouver rapidement les meilleurs produits en magasin.

**Acceptance Criteria:**

**Given** des Products avec références
**When** j'affiche la liste Produits
**Then** chaque `ProductCard` montre nom, enseigne principale, score chip, macros résumé/100g (UX-DR3, UX-DR5)
**And** le tri par défaut est `nutritionalScore` décroissant via ref préférée (AR-6)
**And** la recherche filtre par nom Product en < 200 ms perçu (NFR-2)
**And** tap carte → détail avec `ReferenceRow` triées score ↓, badge « Préférée » (UX-DR3, UX-DR5)
**And** liste vide affiche `EmptyState` avec CTA création (UX-DR11)

### Story 2.4: Scanner et enrichissement Open Food Facts

En tant qu'utilisateur en magasin,
Je veux scanner un code-barres et pré-remplir une référence produit,
Afin d'ajouter un produit en quelques secondes.

**Acceptance Criteria:**

**Given** l'écran Produits avec FAB scan visible (UX-DR4)
**When** je scanne un barcode EAN valide (Android Chrome)
**Then** `OffApiService` appelle GET `world.openfoodfacts.org/api/v2/product/{barcode}` sans données perso (FR-8, AR-8, NFR-4)
**And** si trouvé OFF, un formulaire ProductReference est pré-rempli (nom, marque, macros, ingrédients) modifiable avant save (FR-8)
**And** si `status !== 1`, message « Produit inconnu » + formulaire manuel avec code pré-rempli (FR-8, NFR-9)
**And** si caméra refusée/indisponible, saisie manuelle immédiate (FR-7, UX-DR13)
**And** sur iOS, le bouton « Saisir le code » est en premier plan sans tentative caméra (NFR-10, UX-DR13)
**And** scan < 5 s en conditions normales Android (FR-7)
**And** barcode est stocké sur ProductReference, pas Product (AR-9)

### Story 2.5: Archivage et restauration produit

En tant qu'utilisateur,
Je veux archiver des produits sans casser mes recettes existantes,
Afin de nettoyer mon catalogue tout en gardant l'historique.

**Acceptance Criteria:**

**Given** un Product référencé dans recettes ou garde-manger
**When** j'archive le Product (`deletedAt` renseigné)
**Then** confirmation est demandée (FR-6)
**And** le Product disparaît des listes actives et sélecteurs (FR-6)
**And** les références existantes affichent indicateur « archivé » (FR-6)
**And** je peux restaurer depuis Paramètres → Produits archivés (FR-6)
**When** je scanne un barcode d'une ref archivée
**Then** bottom sheet propose la restauration (AR-9, UX-DR5)

---

## Epic 3: Garde-manger

L'utilisateur gère son stock en grammes avec alertes DLC.

### Story 3.1: CRUD garde-manger

En tant qu'utilisateur,
Je veux ajouter et modifier les quantités de mon stock,
Afin de savoir ce que j'ai chez moi.

**Acceptance Criteria:**

**Given** un Product actif dans le catalogue
**When** j'ajoute une ligne garde-manger avec `quantityG` > 0, DLC et emplacement optionnels
**Then** la table `pantryItems` est créée ; lien sur `productId` uniquement (FR-9, AR-4, AR-11)
**And** je peux modifier la quantité ou supprimer la ligne (FR-10)
**When** la quantité passe à 0
**Then** la ligne est supprimée automatiquement (FR-10)
**And** les opérations CRUD sont perçues < 200 ms (NFR-2)
**And** fonctionne offline (NFR-8)

### Story 3.2: Alertes DLC et filtres

En tant qu'utilisateur,
Je veux voir les produits qui expirent bientôt,
Afin de les consommer à temps.

**Acceptance Criteria:**

**Given** des lignes garde-manger avec DLC renseignée
**When** la DLC est dans ≤ 3 jours
**Then** un badge `{colors.accent-warning}` s'affiche (FR-11, UX-DR2)
**And** les lignes sans DLC n'affichent pas d'alerte (FR-11)
**And** je peux trier/filtrer par DLC ou nom (FR-10)
**And** liste vide affiche `EmptyState` (UX-DR11)

---

## Epic 4: Recettes familles et variantes

L'utilisateur crée des recettes avec variantes et macros calculées.

### Story 4.1: CRUD Recipe famille et première variante

En tant qu'utilisateur,
Je veux créer une recette avec au moins une variante et des ingrédients,
Afin de planifier des repas variés.

**Acceptance Criteria:**

**Given** des Products actifs avec `preferredReferenceId` défini
**When** je crée une Recipe (titre, steps[], durationMin, defaultPortions, tags) + première RecipeVariant
**Then** les tables `recipes`, `recipeVariants`, `recipeIngredients` sont créées (FR-12, AR-13)
**And** chaque ingrédient lie `variantId` + `productId` + `quantityG` en grammes (AR-4, AR-11, AR-13)
**And** au moins une étape et un ingrédient sont requis pour sauvegarder (FR-12)
**And** `defaultVariantId` est défini automatiquement sur la première variante (AR-13)
**And** Product sans ref préférée bloque l'ajout ingrédient avec message explicite (AR-5, UX-DR15)

### Story 4.2: Variantes additionnelles et notation

En tant qu'utilisateur,
Je veux ajouter des variantes (substitution ou scale) et les noter,
Afin de comparer les déclinaisons d'une même recette.

**Acceptance Criteria:**

**Given** une Recipe existante
**When** j'ajoute une RecipeVariant nommée avec ses propres ingrédients
**Then** je peux avoir plusieurs variantes (substitution produit ou scale quantités) (AR-13)
**And** je peux attribuer un `rating` 1–5 étoiles sur la variante (AR-15)
**And** je peux définir `defaultVariantId` parmi les variantes (AR-13)
**And** la liste recettes affiche titre + variante par défaut en sous-titre (UX-DR7)
**And** détail recette utilise segments/onglets par variante (UX-DR7)

### Story 4.3: Calcul macros par portion

En tant qu'utilisateur,
Je veux voir les macros totales et par portion de chaque variante,
Afin d'arbitrer mes choix nutritionnels.

**Acceptance Criteria:**

**Given** une variante avec ingrédients dont les Products ont `preferredReferenceId`
**When** j'affiche la variante
**Then** macros totales = somme `(macroPer100g × quantityG) / 100` pour kcal, P, L, G, fibres (FR-13, AR-5)
**And** macros par portion = total / `defaultPortions` (FR-13)
**And** la mise à jour est immédiate si ingrédient ou portion change (FR-13)
**And** pas de score nutritionnel auto sur la recette (AR-15)

### Story 4.4: Modifier et supprimer recette

En tant qu'utilisateur,
Je veux éditer ou supprimer une recette,
Afin de maintenir mon livre de recettes à jour.

**Acceptance Criteria:**

**Given** une Recipe existante
**When** je la modifie
**Then** les changements sont persistés (FR-14)
**When** je supprime une Recipe référencée dans le Plan
**Then** confirmation est demandée et les `mealPlanEntries` associées sont retirées (FR-14)

---

## Epic 5: Objectifs macros et synthèse

L'utilisateur définit ses cibles et consulte la synthèse journalière.

### Story 5.1: Formulaire objectifs macros

En tant qu'utilisateur,
Je veux définir mes objectifs nutritionnels journaliers,
Afin de suivre mes cibles kcal et macros.

**Acceptance Criteria:**

**Given** l'écran Objectifs (`/goals`) accessible depuis Plan ou Paramètres
**When** je saisis kcal, protéines, lipides, glucides, fibres (g)
**Then** les valeurs sont persistées dans `macroGoals` singleton (FR-15)
**And** les champs vides sont autorisés (objectif non suivi pour ce nutriment) (FR-15)
**And** unités affichées en grammes avec « g » explicite (NFR-12)

### Story 5.2: Synthèse macros journalière

En tant qu'utilisateur,
Je veux voir si mon plan du jour respecte mes objectifs,
Afin d'ajuster mes repas de la semaine.

**Acceptance Criteria:**

**Given** un jour avec `mealPlanEntries` et des objectifs définis (ou partiels)
**When** j'affiche la synthèse du jour
**Then** `MacroBarGroup` affiche 5 barres kcal, P, L, G, fibres (UX-DR8)
**And** agrégation = somme macros/portion des variantes **résolues** (entry.recipeVariantId ?? defaultVariantId) (FR-16, AR-14)
**And** états visuels under/met/over selon écart vs objectif ±5% (UX-DR8)
**And** jour sans repas → barres à 0, message « Aucun repas planifié », pas d'alerte rouge (UX-DR8)
**And** tap barre → bottom sheet détail repas du jour avec macros/portion (UX-DR8)
**And** barres ont aria-label valeur + objectif (UX-DR12)

---

## Epic 6: Plan de repas et choix variante

L'utilisateur planifie sa semaine et choisit les variantes.

### Story 6.1: Vue semaine et assignation recette

En tant qu'utilisateur,
Je veux assigner une recette à chaque créneau de la semaine,
Afin de préparer mes repas à l'avance.

**Acceptance Criteria:**

**Given** l'onglet Plan
**When** j'affiche la vue semaine (7 jours × 3 créneaux)
**Then** `WeekGrid` affiche placeholders « + » sur créneaux vides (UX-DR6)
**When** je tape un créneau vide
**Then** bottom sheet picker recette avec recherche et preview macros/portion (FR-17, UX-DR6)
**And** une seule Recipe par date+slot (FR-17)
**And** `mealPlanEntries` stocke `recipeId` + `recipeVariantId: null` initialement (AR-14)
**And** la table `mealPlanEntries` est créée via `DatabaseService` (FR-17)
**And** je peux modifier ou supprimer une entrée (FR-17)

### Story 6.2: Choix variante et lien synthèse

En tant qu'utilisateur,
Je veux choisir la variante au plan ou au cook et voir la synthèse du jour,
Afin d'adapter mon repas et suivre l'impact macros.

**Acceptance Criteria:**

**Given** un créneau avec Recipe assignée
**When** je tape le chip variante
**Then** `VariantChipRow` affiche les variantes scrollables avec rating ★ et macros/portion (UX-DR7, AR-14)
**And** sélection met à jour `recipeVariantId` (plan dimanche ou cook jour J) (FR-17, AR-14)
**And** créneau affiche « Recette · Variante » ou « Par défaut » (UX-DR6)
**When** je change de jour ou de variante
**Then** la synthèse macros se met à jour sans rechargement complet (FR-18)
**And** lien « Voir synthèse macros » accessible depuis Plan (FR-18, UX-DR8)

---

## Epic 7: Liste de courses et mode magasin

L'utilisateur génère, édite et coche sa liste en magasin.

### Story 7.1: Génération automatique liste

En tant qu'utilisateur,
Je veux générer ma liste depuis le plan et le garde-manger,
Afin de n'acheter que ce qui manque.

**Acceptance Criteria:**

**Given** un Plan de repas et un Garde-manger renseignés
**When** je génère la liste de courses
**Then** pour chaque ingrédient des variantes résolues : `needed = max(0, plannedG - pantryG)` agrégé par `productId` (FR-19, AR-4, AR-14)
**And** items à 0 g sont exclus (FR-19)
**And** `shoppingListItems` créés avec `source: auto` (FR-19)
**And** génération < 2 s pour 21 repas (NFR-3)
**And** `recommendedStores` affichés par Product (AR-7)
**And** liste vide si plan vide → `EmptyState` (UX-DR11)

### Story 7.2: Édition manuelle et régénération

En tant qu'utilisateur,
Je veux ajouter des articles manuellement et régénérer sans perdre mes ajouts,
Afin de compléter ma liste au-delà du plan.

**Acceptance Criteria:**

**Given** une liste existante
**When** j'ajoute un item manuel
**Then** il est marqué `source: manual` avec badge « manuel » (FR-20, UX-DR10)
**And** je peux modifier quantité, supprimer ou cocher tout item (FR-20)
**When** le plan a changé depuis la dernière génération
**Then** `RegenerateBanner` propose la régénération (UX-DR14)
**When** je régénère
**Then** seuls les items `auto` sont recalculés ; items `manual` préservés (quantité + état coché) (FR-20)
**And** items auto et manual pour même Product coexistent en 2 lignes (FR-20)

### Story 7.3: Mode Courses plein écran

En tant qu'utilisateur en magasin,
Je veux cocher mes articles en plein écran,
Afin de faire mes courses rapidement d'une main.

**Acceptance Criteria:**

**Given** une liste de courses
**When** j'active Mode Courses
**Then** bottom nav et FAB sont masqués (UX-DR9)
**And** header affiche compteur « X restants » + bouton « Terminer » (UX-DR9)
**And** `ShoppingRow` a touch target ≥ 52px ; tap zone gauche coche/décoche (FR-21, UX-DR10, UX-DR12)
**And** feedback instantané : opacité + texte barré, pas d'animation (FR-21, AD-12, UX-DR9)
**And** fonctionne offline (FR-21, NFR-8)
**When** je tape Terminer
**Then** retour liste normale avec états cochés conservés (UX-DR9)

---

## Epic 8: Sauvegarde et restauration

L'utilisateur exporte et importe ses données localement.

### Story 8.1: Export JSON avec chiffrement optionnel

En tant qu'utilisateur,
Je veux exporter toutes mes données en fichier sécurisé,
Afin de sauvegarder avant un changement d'appareil.

**Acceptance Criteria:**

**Given** l'écran Paramètres → Exporter
**When** je lance un export
**Then** le fichier contient `schemaVersion`, `exportedAt`, `data` avec toutes tables MVP incluant `productReferences` et `recipeVariants` (FR-22, AR-10, AR-18)
**And** option chiffrement AES-GCM (PBKDF2 + Web Crypto) → extension `.nutrition-backup.enc` (FR-22, AR-10)
**And** export non chiffré possible avec avertissement explicite (FR-22, NFR-6)
**And** `lastExportAt` mis à jour dans `appSettings` (FR-24)

### Story 8.2: Import avec validation et modes merge

En tant qu'utilisateur,
Je veux restaurer mes données depuis un backup,
Afin de migrer vers un nouveau téléphone ou fusionner des exports.

**Acceptance Criteria:**

**Given** un fichier export valide
**When** j'importe en mode « Remplacer tout »
**Then** validation schéma avant écriture ; truncate + bulk insert (FR-23)
**When** j'importe en mode « Fusionner »
**Then** règles PRD §10 appliquées (products par barcode/name+brand, pantry addition, recipes replace, mealPlan upsert, shopping skip, macroGoals merge) (FR-23)
**When** mot de passe incorrect sur fichier chiffré
**Then** échec sans altérer données courantes (FR-23)
**And** résumé post-import affiché (X produits, Y recettes…) (FR-23)

### Story 8.3: Rappel backup 30 jours

En tant qu'utilisateur,
Je veux être rappelé de sauvegarder régulièrement,
Afin de ne pas perdre mes données.

**Acceptance Criteria:**

**Given** aucun export depuis ≥ 30 jours (`lastExportAt`)
**When** j'ouvre l'application
**Then** un rappel discret s'affiche avec lien vers Export (FR-24)
**And** le rappel est dismissable (FR-24)
**And** pas de rappel si export récent (FR-24)
