# Epic 12 Context: Accueil intelligent et onboarding recette

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

À l'ouverture, l'utilisateur voit quoi faire ensuite et atteint sa première recette planifiable sans documentation externe. L'accueil agrège les prochaines actions utiles ; un onboarding court (3 étapes) guide jusqu'à une recette dont les ingrédients viennent de la bibliothèque. Cet epic est le dernier du lot post-MVP : il s'appuie sur la friction recettes déjà résolue (bibliothèque + recherche) et n'introduit ni journal alimentaire, ni comptes cloud, ni gamification.

## Stories

- Story 12.1: Tableau de bord d'accueil
- Story 12.2: Onboarding première recette (3 étapes)
- Story 12.3: Raccourcis contextuels cross-surfaces

## Requirements & Constraints

- L'accueil présente les prochaines actions utiles en ≤ 2 taps : repas du jour, articles courses restants, produits DLC ≤ 3 jours, rappel d'export si aucun export depuis 30 jours.
- Chaque carte mène à la surface métier correspondante (Plan, Courses, Garde-manger, Paramètres / Export) sans parcours intermédiaire.
- Un onboarding court guide la première recette avec ingrédients issus de la bibliothèque (pas de saisie macros manuelle).
- Trois étapes : (1) objectifs macros optionnels, skip autorisé ; (2) import du pack Ciqual « 50 bases » ou parcours bibliothèque ; (3) création d'une recette simple (template suggéré).
- Complétion persistée ; relançable depuis Paramètres.
- Option Paramètres « Masquer l'accueil au démarrage » — défaut : afficher tant que l'onboarding n'est pas terminé.
- Hors scope inchangé : journal repas-par-repas, sync / comptes, gamification culpabilisante, thème clair.
- UI et messages en français ; local-first ; aucune donnée personnelle envoyée à une API.
- Mode Courses inchangé fonctionnellement (pas d'animations distrayantes).
- Contrastes WCAG AA et cibles tactiles ≥ 44 px conservés.

## Technical Decisions

- Nouvelle surface d'accueil en feature lazy (l'architecture actuelle n'a pas de route home ; les 5 onglets métier restent). Point d'entrée : cold start ou tap logo — pas un sixième onglet bottom-nav.
- Flags dans le singleton `appSettings` existant : complétion onboarding + préférence masquer-accueil. `lastExportAt` déjà utilisé pour le rappel 30 jours.
- Le tableau de bord ne fait qu'agréger des lectures locales (plan du jour, items courses non cochés, pantry DLC, export) via les services métier / `DatabaseService` — pas de store global, pas de nouvelle entité métier.
- Étape 2 d'onboarding réutilise l'import groupé pack Ciqual (Epic 10) : copie locale `Product` / `ProductReference`, existants ignorés, idempotent.
- Étape 3 crée une vraie `Recipe` (+ variante) via le flux recettes existant et le picker bibliothèque — pas un tutoriel factice.
- Raccourcis : menu long-press / ⋮ déjà prévu sur cartes produit et recette ; chaque action ouvre un bottom sheet minimal (ajout garde-manger, utiliser dans une recette, ajout liste manuelle) sans changer d'onglet.
- Signals + services ; IndexedDB uniquement via `DatabaseService`.

## UX & Interaction Patterns

- IA actuelle : 5 onglets (Garde-manger, Produits, Recettes, Plan, Courses) + engrenage Paramètres ; cold start = dernier onglet ou Garde-manger. Cet epic insère l'accueil *avant* ce défaut tant qu'il n'est pas masqué.
- Cartes actionnables, pas un feed. Empty states : icône + message orientant + CTA (ex. « Aucune recette — créez-en une pour planifier votre semaine »). Ton factuel ; pas d'encouragements ni de culpabilisation macros.
- Onboarding linéaire 3 écrans, skip uniquement sur les macros. Template recette simple suggéré, ingrédients pré-liés à la bibliothèque.
- Raccourcis : long-press ou ⋮ → bottom sheet drag-to-dismiss ; ne pas quitter le contexte.
- Palette forêt (Epic 9) pour titres / empty states ; transitions instantanées entre onglets ; `prefers-reduced-motion` respecté.

## Cross-Story Dependencies

- Ordre post-MVP verrouillé : E10 → E11 → E9 → E12. Bloqué sur Epic 10 (pack Ciqual + picker ingrédient) ; E11 n'est pas requis pour l'onboarding (offline suffit).
- 12.2 s'enchaîne sur 12.1 (première ouverture = onboarding, puis accueil).
- 12.3 s'applique aux cartes Produits et Recettes existantes ; indépendant de 12.1/12.2 une fois les surfaces en place.
- Consomme sans les modifier : plan (E6), courses (E7), DLC pantry (E3), rappel export (E8), CRUD recettes (E4), objectifs macros (E5).
