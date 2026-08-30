---
title: Nutrition
status: final
created: 2026-08-30
updated: 2026-08-30
source_brief: ../brief-2026-08-30/brief.md
revision: "Décisions §10 — soft delete, regen liste, pantry 0, import merge"
---

# PRD : Nutrition

## 0. Objet du document

Ce PRD décrit les exigences fonctionnelles et non fonctionnelles du MVP de **Nutrition**, application personnelle de gestion alimentaire (garde-manger, produits, recettes, planification, courses, objectifs macros). Il s’adresse au développeur-propriétaire et aux workflows BMAD en aval (UX, architecture, epics).

Vocabulaire ancré dans le **Glossaire** (§3). Les exigences sont numérotées globalement (FR-1…FR-N) pour référence stable dans les stories. Le brief produit (`brief-2026-08-30/brief.md`) et son addendum sont les sources d’intention ; les détails techniques sont dans `addendum.md` de ce dossier PRD.

## 1. Vision

Nutrition est une PWA Angular **mobile-first**, installable sur l’écran d’accueil du téléphone, qui réduit la charge cognitive liée à une alimentation saine. L’utilisateur gère son **Catalogue Produit**, son **Garde-manger**, planifie des **Repas** à partir de **Recettes**, génère une **Liste de Courses** intelligente et suit ses **Objectifs Macros** via une synthèse du **Plan de Repas** — le tout **sans compte cloud** ni serveur applicatif.

Les données vivent **100 % en local** (IndexedDB). L’utilisateur peut **exporter** et **importer** une sauvegarde chiffrée pour éviter toute perte lors d’un changement d’appareil. En magasin, le **scan code-barres** enrichit le Catalogue via Open Food Facts, avec repli saisie manuelle.

Ce n’est pas un clone MyFitnessPal : pas de journal alimentaire repas-par-repas. C’est un **assistant courses-cuisine-planification** pour un usage solo en France.

## 2. Utilisateur cible

### 2.1 Jobs To Be Done

- **Fonctionnel** — Savoir quoi acheter, quoi cuisiner avec ce que j’ai, et si mon plan de la semaine respecte mes objectifs nutritionnels.
- **Émotionnel** — Manger sain sans y passer des heures ni culpabiliser quand le plan dérape.
- **Contextuel** — En magasin (téléphone, une main), le dimanche soir (planification), à la maison (garde-manger).

### 2.2 Non-utilisateurs (v1)

- Familles multi-comptes, nutritionnistes, coachs sportifs.
- Utilisateurs cherchant un suivi calorique exhaustif de chaque bouchée.
- Marché grand public / SaaS multi-tenant.

### 2.3 Parcours utilisateur clés

**UJ-1. Ronan planifie sa semaine le dimanche soir**
- **Persona + contexte :** Ronan, dev solo, veut préparer la semaine en < 10 min.
- **État d’entrée :** PWA installée, Garde-manger à jour, Recettes déjà créées.
- **Chemin :** Ouvre Plan de Repas → assigne une Recette par créneau (petit-déj / déj / dîner) sur 5–7 jours → consulte la Synthèse Macros par jour → génère la Liste de Courses.
- **Climax :** La Liste de Courses ne contient que les ingrédients manquants (Plan − Garde-manger).
- **Résolution :** Liste prête pour le samedi ; Synthèse indique si les jours respectent les Objectifs Macros.
- **Cas limite :** Garde-manger vide → liste = total des ingrédients du Plan.

**UJ-2. Ronan scanne un yaourt en rayon**
- **Persona + contexte :** Ronan compare deux marques en magasin.
- **État d’entrée :** Mode courses ou ajout Produit, réseau disponible.
- **Chemin :** Ouvre le Scanner → scanne le code-barres → lookup Open Food Facts → prévisualise macros / 100 g → confirme l’ajout au Catalogue (et optionnellement au Garde-manger).
- **Climax :** Produit créé en quelques secondes avec macros pré-remplies.
- **Résolution :** Produit disponible pour Recettes et Listes futures.
- **Cas limite :** Produit absent d’OFF ou scan impossible (iOS) → saisie manuelle du code ou création Produit à la main.

**UJ-3. Ronan sauvegarde avant changement de téléphone**
- **Persona + contexte :** Migration d’appareil, ne veut rien perdre.
- **Chemin :** Paramètres → Exporter → choisit chiffrement + mot de passe → fichier `.nutrition-backup.enc` → sur le nouveau téléphone : Importer → saisit mot de passe → données restaurées.
- **Climax :** Garde-manger, Recettes, Plan et Objectifs Macros identiques après import.
- **Cas limite :** Mauvais mot de passe → message clair, aucune corruption des données existantes.

## 3. Glossaire

- **Catalogue Produit** — Ensemble des Produits référencés dans l’application. Source pour Garde-manger, Recettes et Listes.
- **Produit** — Entrée du Catalogue : nom, marque, code-barres optionnel, macros pour 100 g (kcal, protéines, lipides, glucides, fibres), liste d’ingrédients textuelle. Un Produit **archivé** (`deletedAt` renseigné) n’apparaît plus dans les sélecteurs mais reste lisible dans les références existantes.
- **Garde-manger** — Stock local : lignes associant un Produit à une quantité en grammes, une DLC optionnelle, un emplacement optionnel.
- **Recette** — Instructions de cuisine : titre, étapes, durée, nombre de portions, ingrédients (Produit + grammes).
- **Plan de Repas** — Calendrier associant une Recette à une date et un créneau (petit-déj, déj, dîner).
- **Liste de Courses** — Liste d’items (Produit + grammes) à acheter, générée ou manuelle, cochable en mode courses.
- **Objectifs Macros** — Cibles journalières : kcal, protéines (g), lipides (g), glucides (g), fibres (g).
- **Synthèse Macros** — Agrégat des macros du Plan de Repas pour un jour donné, comparé aux Objectifs Macros.
- **Export / Import** — Sauvegarde ou restauration de toutes les entités locales au format JSON versionné.
- **Open Food Facts (OFF)** — API publique lecture seule pour enrichir un Produit via code-barres.
- **Mode Courses** — Vue plein écran de la Liste de Courses optimisée magasin (gros touch targets, thème sombre).

## 4. Fonctionnalités

### 4.1 Fondations application

**Description :** PWA Angular installable, navigation par features, stockage IndexedDB, thème sombre par défaut, français, offline pour les parcours critiques (Garde-manger, Liste de Courses, Plan). Réalise les prérequis de tous les UJ.

**Exigences fonctionnelles :**

#### FR-1 : Installation PWA

L’utilisateur peut installer Nutrition sur l’écran d’accueil et l’ouvrir en plein écran.

**Conséquences (testables) :**
- Le manifest PWA est valide (nom, icônes, `display: standalone`).
- L’application démarre sans erreur après installation.

#### FR-2 : Thème sombre par défaut

L’application s’affiche en thème sombre à la première ouverture.

**Conséquences (testables) :**
- Fond principal sombre, texte contrasté (ratio ≥ 4.5:1 pour le corps de texte).
- Le thème persiste entre les sessions.

#### FR-3 : Stockage local

Toutes les entités métier sont persistées dans IndexedDB sans serveur applicatif.

**Conséquences (testables) :**
- Fermer et rouvrir l’app conserve les données.
- Aucun appel réseau n’est requis pour lire/écrire les entités locales.

#### FR-4 : Navigation principale

L’utilisateur accède aux surfaces : Garde-manger, Produits, Recettes, Plan de Repas, Liste de Courses, Objectifs Macros, Paramètres.

**Conséquences (testables) :**
- Chaque surface est atteignable en ≤ 2 interactions depuis l’accueil.
- Navigation utilisable au pouce (barre basse ou équivalent mobile-first).

**NFR transverses (feature) :**
- First Contentful Paint < 3 s sur mobile milieu de gamme (réseau 4G).
- Interface entièrement en français.

---

### 4.2 Catalogue Produit

**Description :** CRUD Produits, macros normalisées pour 100 g, scan code-barres + lookup OFF, saisie manuelle en repli. Réalise UJ-2.

#### FR-5 : Créer un Produit manuellement

L’utilisateur peut créer un Produit avec nom, marque, macros / 100 g (kcal, P, L, G, fibres) et ingrédients textuels.

**Conséquences (testables) :**
- Tous les champs macros acceptent des nombres ≥ 0.
- Le Produit apparaît dans la liste Produits après sauvegarde.

#### FR-6 : Modifier et archiver un Produit (soft delete)

L’utilisateur peut éditer un Produit ou l’**archiver** (soft delete) du Catalogue.

**Conséquences (testables) :**
- L’archivage pose `deletedAt` ; le Produit disparaît des listes actives et des sélecteurs (nouvelle Recette, ajout Garde-manger).
- Les références existantes (Garde-manger, Recettes, Liste de Courses) restent valides et affichent le Produit avec indicateur « archivé ».
- Confirmation demandée si le Produit est référencé.
- L’utilisateur peut **restaurer** un Produit archivé depuis Paramètres ou une vue « Produits archivés ».
- Un Produit archivé avec le même code-barres peut être recréé → restauration proposée en priorité.

#### FR-7 : Scanner un code-barres

L’utilisateur peut ouvrir un Scanner caméra et lire un code-barres EAN.

**Conséquences (testables) :**
- Sur Android Chrome, un scan valide retourne le code en < 5 s dans des conditions normales.
- Si la caméra est refusée ou indisponible, l’UI propose immédiatement la saisie manuelle du code.

#### FR-8 : Enrichir via Open Food Facts

L’utilisateur peut rechercher un Produit par code-barres via OFF et pré-remplir nom, marque, macros et ingrédients.

**Conséquences (testables) :**
- Appel `GET /api/v2/product/{barcode}` sans envoi de données personnelles.
- Si `status !== 1` (produit inconnu), message clair + formulaire manuel pré-rempli avec le code-barres.
- L’utilisateur peut corriger les champs avant sauvegarde.

**Out of Scope :**
- Comparateur multi-marques (post-MVP).

---

### 4.3 Garde-manger

**Description :** Gérer le stock domestique en grammes. Réalise UJ-1 (entrée), UJ-2 (ajout post-achat).

#### FR-9 : Ajouter au Garde-manger

L’utilisateur peut ajouter un Produit actif du Catalogue avec une quantité en grammes.

**Conséquences (testables) :**
- Quantité strictement en grammes (entier ou décimal > 0 à la création).
- DLC et emplacement optionnels.

#### FR-10 : Consulter et modifier le stock

L’utilisateur voit la liste du Garde-manger, modifie les quantités ou retire des lignes.

**Conséquences (testables) :**
- Si la quantité passe à 0, la **ligne est supprimée** automatiquement.
- Tri/filtre par DLC ou nom disponible.

#### FR-11 : Alerte DLC proche

L’utilisateur voit un indicateur visuel pour les lignes dont la DLC est dans les 3 jours.

**Conséquences (testables) :**
- Les lignes sans DLC n’affichent pas d’alerte.
- Le seuil (3 jours) est constant au MVP.

---

### 4.4 Recettes

**Description :** CRUD Recettes avec ingrédients liés au Catalogue, calcul macros par portion. Réalise UJ-1.

#### FR-12 : Créer une Recette

L’utilisateur crée une Recette : titre, étapes, durée (min), portions, tags optionnels.

**Conséquences (testables) :**
- Au moins une étape et un ingrédient requis pour sauvegarder.
- Chaque ingrédient = Produit du Catalogue + quantité en grammes.

#### FR-13 : Macros par portion

L’application calcule et affiche les macros totales de la Recette et par portion (kcal, P, L, G, fibres).

**Conséquences (testables) :**
- Calcul basé sur les macros / 100 g des Produits et les grammes des ingrédients.
- Mise à jour immédiate si un ingrédient ou une portion change.

#### FR-14 : Modifier et supprimer une Recette

L’utilisateur peut éditer ou supprimer une Recette.

**Conséquences (testables) :**
- Suppression d’une Recette référencée dans le Plan de Repas → confirmation + retrait des entrées Plan associées.

---

### 4.5 Objectifs Macros et Synthèse

**Description :** Définir des cibles journalières et comparer au Plan de Repas. Réalise UJ-1.

#### FR-15 : Définir les Objectifs Macros

L’utilisateur définit ses cibles journalières : kcal, protéines, lipides, glucides, fibres.

**Conséquences (testables) :**
- Valeurs persistées localement.
- Champs vides autorisés (objectif non suivi pour ce nutriment).

#### FR-16 : Synthèse Macros journalière

Pour chaque jour du Plan de Repas, l’utilisateur voit le total des macros des Recettes planifiées et l’écart vs Objectifs Macros.

**Conséquences (testables) :**
- Agrégation = somme des macros par portion × 1 repas planifié par créneau.
- Affichage visuel : atteint / dépassé / sous l’objectif (couleur ou barre).
- Jours sans Repette planifiée → synthèse à 0.

**Out of Scope :**
- Journal de ce qui a été réellement mangé (vs planifié).

---

### 4.6 Plan de Repas

**Description :** Planifier les Repas de la semaine courante (et semaine suivante optionnelle). Réalise UJ-1.

#### FR-17 : Assigner une Recette à un créneau

L’utilisateur assigne une Recette à une date et un créneau (petit-déj, déj, dîner).

**Conséquences (testables) :**
- Vue semaine (7 jours) par défaut.
- Une seule Recette par créneau et par date.
- Modification et suppression possibles.

#### FR-18 : Vue Synthèse depuis le Plan

Depuis le Plan de Repas, l’utilisateur accède à la Synthèse Macros du jour sélectionné (FR-16).

**Conséquences (testables) :**
- Changement de jour met à jour la Synthèse sans rechargement complet.

---

### 4.7 Liste de Courses

**Description :** Génération automatique et mode magasin. Réalise UJ-1, UJ-2.

#### FR-19 : Générer la Liste de Courses

L’utilisateur génère une Liste à partir du Plan de Repas et du Garde-manger.

**Conséquences (testables) :**
- Pour chaque ingrédient du Plan : besoin = quantité planifiée − quantité Garde-manger (min 0).
- Agrégation par Produit (somme des grammes manquants).
- Les items à 0 g ne figurent pas dans la Liste.

#### FR-20 : Éditer la Liste manuellement

L’utilisateur ajoute, modifie, supprime ou coche des items.

**Conséquences (testables) :**
- Items manuels distingués des items auto (`source: manual | auto`).
- **Régénération** : recalcule uniquement les items `source: auto` ; les items `source: manual` sont **préservés** (quantité, état coché).
- Les anciens items auto absents du nouveau calcul sont supprimés ; les nouveaux items auto sont ajoutés non cochés.
- Si un item auto et un item manual concernent le même Produit, les deux lignes coexistent (pas de fusion automatique).

#### FR-21 : Mode Courses

L’utilisateur active une vue plein écran pour cocher les items en magasin.

**Conséquences (testables) :**
- Touch targets ≥ 44 px.
- Fonctionne offline.
- Thème sombre actif.

---

### 4.8 Sauvegarde et restauration

**Description :** Export / import pour migration et backup. Réalise UJ-3.

#### FR-22 : Exporter les données

L’utilisateur exporte toutes les entités locales en fichier JSON.

**Conséquences (testables) :**
- Fichier contient `schemaVersion`, `exportedAt`, `data`.
- Option chiffrement AES-GCM (mot de passe) → extension `.nutrition-backup.enc`.
- Export non chiffré possible avec avertissement explicite.

#### FR-23 : Importer les données

L’utilisateur restaure depuis un fichier exporté en choisissant le mode d’import.

**Conséquences (testables) :**
- Validation du schéma avant toute écriture.
- **Mode « Remplacer tout »** (défaut, recommandé pour migration téléphone) : vide toutes les tables locales puis importe le fichier.
- **Mode « Fusionner »** : règles détaillées en §10 et addendum ; aucune perte des données locales non couvertes par le fichier.
- Mot de passe incorrect → échec sans altérer les données courantes.
- Résumé post-import : X produits ajoutés/mis à jour, Y recettes, etc.

#### FR-24 : Rappel de sauvegarde

L’application affiche un rappel discret si aucun Export depuis 30 jours.

**Conséquences (testables) :**
- Rappel dismissable.
- Pas de rappel si Export récent.

---

## 5. Non-objectifs explicites

- Backend applicatif, sync multi-appareils, comptes utilisateurs.
- Journal alimentaire consommé (vs planifié).
- Unités autres que grammes (pièces, cuillères, ml).
- Comparateur marques, mapping enseignes, budget courses.
- Génération IA de Recettes.
- Application native iOS/Android hors PWA.
- Thème clair au MVP (sauf si trivial via CSS variables — sinon v1.1).

## 6. Périmètre MVP

### 6.1 Inclus

- PWA Angular, IndexedDB, thème sombre, français.
- Catalogue Produit + scan OFF + saisie manuelle.
- Garde-manger (grammes, DLC, alertes).
- Recettes + macros par portion.
- Objectifs Macros + Synthèse Plan vs objectifs.
- Plan de Repas (semaine).
- Liste de Courses auto + manuelle + Mode Courses.
- Export / import chiffré.

### 6.2 Hors MVP

| Élément | Raison |
|---------|--------|
| Thème clair | Priorité usage magasin ; dark suffit au MVP |
| Comparateur marques | Epic post-MVP |
| Mapping enseignes | Pas d’API fiable ; saisie manuelle plus tard |
| Sync PC ↔ téléphone | Backup fichier suffit |
| Scan sans réseau (cache OFF) | Complexité ; lookup online au MVP |

## 7. Métriques de succès

**Primaires**
- **SM-1** : Utilisation hebdomadaire — l’utilisateur ouvre l’app ≥ 1×/semaine pendant 4 semaines consécutives. Valide FR-17, FR-19.
- **SM-2** : Préparation courses < 10 min — planifier une semaine + générer la Liste en un seul flux. Valide FR-17, FR-19, FR-20.

**Secondaires**
- **SM-3** : Export / import sans perte — round-trip complet des données. Valide FR-22, FR-23.
- **SM-4** : Scan utile — ≥ 50 % des nouveaux Produits créés via scan OFF (mesure perso). Valide FR-7, FR-8.

**Contre-métriques**
- **SM-C1** : Ne pas optimiser le nombre de fonctionnalités — la simplicité prime sur la complétude.

## 8. Exigences non fonctionnelles transverses

### Performance
- Interactions CRUD locales < 200 ms perçu.
- Génération Liste de Courses < 2 s pour un Plan de 21 Repas.

### Sécurité et confidentialité
- Aucune donnée utilisateur envoyée à un tiers sauf code-barres vers OFF (lecture seule).
- Pas de télémétrie analytics tiers au MVP.
- Export chiffré recommandé par défaut dans l’UI.

### Accessibilité
- Contrastes WCAG AA en thème sombre.
- Labels sur tous les champs de formulaire.

### Offline
- Garde-manger, Recettes, Plan, Liste de Courses, Mode Courses : fonctionnels offline.
- Lookup OFF : nécessite réseau ; message explicite si offline.

### Plateforme
- Cible principale : Android Chrome PWA.
- iOS Safari : repli saisie manuelle obligatoire pour Produits.

## 9. Epics (aperçu pour solutioning)

| Epic | Description | FRs |
|------|-------------|-----|
| E1 | Fondations PWA, thème sombre, IndexedDB, navigation | FR-1…4 |
| E2 | Catalogue Produit + scan OFF | FR-5…8 |
| E3 | Garde-manger | FR-9…11 |
| E4 | Recettes + calcul macros | FR-12…14 |
| E5 | Objectifs Macros + Synthèse | FR-15…16 |
| E6 | Plan de Repas | FR-17…18 |
| E7 | Liste de Courses + Mode Courses | FR-19…21 |
| E8 | Export / Import + rappel backup | FR-22…24 |

Ordre d’implémentation recommandé : E1 → E2 → E3 → E4 → E6 → E7 → E5 → E8.

## 10. Décisions produit (résolues)

### 10.1 Archivage Produit (soft delete)

- Champ `deletedAt` sur `Product` ; pas de suppression physique au MVP.
- Références historiques conservées ; sélection bloquée pour nouveaux usages.
- Restauration possible.

### 10.2 Régénération Liste de Courses

Recalcul **uniquement des items auto** ; items manuels intouchés. C’est le comportement le plus logique : le plan de repas change, mais le papier toilette ajouté à la main reste.

### 10.3 Garde-manger à quantité 0

La ligne est **supprimée** dès que la quantité atteint 0.

### 10.4 Import — modes et règles de fusion

| Mode | Usage | Comportement |
|------|-------|--------------|
| **Remplacer tout** | Nouveau téléphone, restauration complète | Truncate + import intégral |
| **Fusionner** | Combiner deux exports / enrichir le catalogue | Règles ci-dessous |

**Règles mode Fusionner :**

| Entité | Clé de correspondance | Résolution |
|--------|----------------------|------------|
| **Product** | 1) `barcode` identique 2) sinon `name+brand` normalisés | Existant mis à jour ; sinon création. IDs import remappés pour les FK. |
| **PantryItem** | `productId` après remapping Produit | **Additionner** les quantités (g) |
| **Recipe** | `id` identique | Remplacer recette + ingrédients |
| **Recipe** | `id` inconnu | Créer nouvelle recette (nouvel id) |
| **MealPlanEntry** | même `date` + `slot` | Import **remplace** l’entrée locale |
| **MacroGoals** | singleton | Champs non-null de l’import **écrasent** les locaux |
| **ShoppingListItem** | — | **Ignorés** en fusion (trop contextuel ; régénérer après) |
| **AppSettings** | singleton | `lastExportAt` = max(local, import) ; reste inchangé |

En cas de doute sur un Produit sans barcode et noms proches : **créer** plutôt qu’écraser (évite la perte silencieuse).

## 11. Index des hypothèses

- `[ASSUMPTION]` L’utilisateur principal utilise Android Chrome comme navigateur PWA principal.
- `[ASSUMPTION]` Une Recette par créneau par jour suffit au MVP (pas de plusieurs plats par repas).
- `[ASSUMPTION]` Les macros OFF sont suffisamment fiables pour pré-remplissage (l’utilisateur vérifie en magasin).
