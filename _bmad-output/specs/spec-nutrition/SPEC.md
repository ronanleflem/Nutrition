---
id: SPEC-nutrition
companions:
  - glossary.md
  - data-model.md
  - architecture-diagrams.md
  - ../planning-artifacts/architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md
  - ../planning-artifacts/architecture/architecture-Nutrition-2026-08-30/SOLUTION-DESIGN.md
  - ../../project-context.md
sources:
  - ../planning-artifacts/prds/prd-Nutrition-2026-08-30/prd.md
  - ../planning-artifacts/prds/prd-Nutrition-2026-08-30/addendum.md
  - ../planning-artifacts/brief-2026-08-30/brief.md
---

> **Contrat canonique.** Ce SPEC et les fichiers `companions:` constituent le contrat machine pour build, tests et epics. Les `sources:` sont pour audit ; les AD et règles d’implémentation vivent dans la spine adoptée.

# Nutrition — MVP

## Why

Ronan veut réduire la charge cognitive d’une alimentation saine en France : savoir quoi acheter, quoi cuisiner avec le stock, et si le plan de la semaine respecte ses macros — **sans cloud ni compte**. Le catalogue Excel (produits génériques, références par enseigne, scores) et le coaching architecture ont fixé un modèle **Product + ProductReference** et des **recettes par variantes** ; ce SPEC aligne le PRD sur ces invariants pour que epics et code ne divergent pas.

## Capabilities

- **CAP-1**
  - **intent:** L’utilisateur installe et utilise une PWA Angular mobile-first, en français, avec données locales et parcours critiques offline.
  - **success:** Manifest valide, standalone, navigation ≤ 2 taps vers chaque surface (FR-1–4) ; FCP < 3 s sur mobile milieu de gamme ; données persistantes sans serveur.

- **CAP-2**
  - **intent:** L’utilisateur gère un catalogue **Product** (générique) et des **ProductReference** (enseigne/marque/macros), scanne des codes-barres, enrichit via OFF, trie par score nutritionnel.
  - **success:** CRUD + soft delete produit ; scan → ref par barcode ; macros / 100 g sur référence ; `nutritionalScore` stocké et triable ; enseignes recommandées ordonnées (FR-5–8).

- **CAP-3**
  - **intent:** L’utilisateur suit son garde-manger en grammes avec DLC et alertes.
  - **success:** CRUD stock lié à `productId` ; quantité 0 supprime la ligne ; alerte DLC ≤ 3 jours (FR-9–11).

- **CAP-4**
  - **intent:** L’utilisateur crée des **recettes familles** avec **variantes** (substitution ou scale macros), note les variantes en étoiles, et voit les macros par portion.
  - **success:** `Recipe` + `RecipeVariant` + ingrédients sur `variantId` ; au moins une variante ; `defaultVariantId` ; rating 1–5 sur variante ; macros calculées depuis ingrédients (macros canoniques produit via ref préférée) (FR-12–14 + AD-13/15).

- **CAP-5**
  - **intent:** L’utilisateur définit des objectifs macros journaliers et compare la synthèse du plan du jour.
  - **success:** Objectifs persistés ; synthèse = somme macros variantes **résolues** du plan vs objectifs ; affichage écart (FR-15–16).

- **CAP-6**
  - **intent:** L’utilisateur planifie une recette par créneau/jour et choisit la **variante** au plan (dimanche) ou au cook (jour J).
  - **success:** `mealPlanEntry.recipeVariantId` nullable ; variante résolue = entry ou `defaultVariantId` ; changement variante au cook met à jour synthèse (FR-17–18 + AD-14).

- **CAP-7**
  - **intent:** L’utilisateur génère et édite une liste de courses depuis plan − garde-manger, avec mode magasin.
  - **success:** Agrégation par `productId` sur ingrédients des variantes résolues ; auto vs manual ; régénération préserve manual ; mode courses offline ≥ 44 px touch (FR-19–21).

- **CAP-8**
  - **intent:** L’utilisateur exporte et importe toutes les entités avec backup chiffré optionnel.
  - **success:** JSON `schemaVersion` ; modes remplacer/fusionner selon règles addendum ; échec mot de passe sans corruption ; rappel 30 jours (FR-22–24).

## Constraints

- Données 100 % locales IndexedDB ; **aucun** backend applicatif ni auth MVP (AD-1).
- **DatabaseService** seule porte Dexie ; features ne touchent pas IndexedDB directement (AD-2).
- Catalogue : **Product** + **ProductReference** ; barcode sur référence ; OFF GET read-only (AD-3, AD-8, AD-9).
- Pantry, recettes, courses : liens sur **productId** générique, jamais referenceId (AD-4).
- Macros produit : **preferredReferenceId** ; score sur référence recalculé au save (AD-5, AD-6).
- Recettes : ingrédients sur **variantId** ; plan/cook via **recipeVariantId** nullable (AD-13, AD-14).
- Notation **étoiles sur variante** ; pas de score macro auto sur recette MVP (AD-15).
- Unités **grammes** uniquement ; UI **thème sombre** par défaut ; français partout.
- Stack pin : Angular 22.1.4, Dexie 4.4.5 — voir `data-model.md` et spine.

## Non-goals

- Backend, sync cloud, multi-utilisateur, journal « mangé vs planifié ».
- Comparateur marques **avancé** (grille Excel multi-enseignes) — MVP = liste refs + tri score.
- Score nutritionnel **automatique sur recettes**.
- Génération IA recettes, app native hors PWA, thème clair MVP.
- Unités pièces/ml, mapping prix enseignes automatique.

## Success signal

En une session type « dimanche soir » : planifier la semaine avec variantes (ou défaut), voir la synthèse macros par jour, générer une liste de courses sans doublons inutiles, scanner un produit en magasin, et restaurer un export sur un autre appareil sans perte — le tout sans compte ni réseau obligatoire hors OFF.
