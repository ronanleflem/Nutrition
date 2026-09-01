# Project Context — Nutrition

> Fichier de contexte pour les workflows BMAD (architecture, build, stories).
> Complète le bloc `AGENTS.md` avec les décisions produit et techniques verrouillées.

## Produit

- Application **personnelle** de nutrition : garde-manger, recettes, planification, liste de courses.
- **Single-user**, France, français.
- Objectifs macros journaliers (kcal, P/L/G, fibres) + synthèse plan vs objectifs au MVP.
- Pas de journal alimentaire repas-par-repas type MyFitnessPal au MVP.

## Stack (décidée)

| Couche | Choix |
|--------|-------|
| Frontend | Angular (dernière stable), PWA |
| Stockage | IndexedDB (Dexie.js recommandé) |
| Backend MVP | **Aucun** |
| Tests | Vitest / Jasmine (selon setup Angular) |
| Package manager | npm |
| BMAD | v6.11.0, module BMM |

## Règles d’implémentation

1. **Local-first** — toute donnée utilisateur dans IndexedDB ; pas d’appel réseau obligatoire hors enrichissement produit.
2. **Pas de backend** au MVP — ne pas introduire FastAPI/Spring sans décision explicite dans le PRD.
3. **Export / import** — chaque entité métier doit être sérialisable ; format JSON versionné ; chiffrement AES-GCM optionnel (Web Crypto).
4. **APIs externes** — lecture seule : OFF (barcode + search), USDA FDC (fallback, clé locale), FoodRepo (optionnel). Embarqué : Ciqual + OpenNutrition. Pas d’envoi de données perso. Voir `planning-artifacts/DATA-SOURCES.md`.
5. **Mobile-first** — UI pensée pour usage en magasin (gros touch targets, mode liste courses).
6. **Pas d’auth** — pas de login, pas de JWT, pas de compte.
7. **Conventions Angular** — standalone components, signals où pertinent, lazy routes par feature.
8. **Langue** — UI et messages en français.
9. **Unités** — grammes uniquement ; macros produits normalisées pour 100 g.
10. **Scan code-barres** — `@zxing/ngx-scanner` + lookup Open Food Facts ; toujours proposer saisie manuelle en repli (iOS).
11. **Objectifs macros** — entité `MacroGoals` locale ; comparer le total du plan de repas du jour aux cibles.
12. **Thème UI** — sombre par défaut ; palette contrastée pour usage magasin (lisibilité, OLED).
13. **Recettes** — famille `Recipe` + `RecipeVariant` (substitution/scale) ; plan/cook via `mealPlanEntry.recipeVariantId` ; notation étoiles sur variante.

## Structure cible (features)

```
src/app/
  core/           # services transverses, backup, db
  features/
    pantry/
    products/
    recipes/
    meal-plan/
    shopping-list/
    macro-goals/  # objectifs journaliers + synthèse plan
    settings/     # export, import, about
```

## Artefacts BMAD

| Artefact | Chemin |
|----------|--------|
| Brief | `_bmad-output/planning-artifacts/brief-2026-08-30/brief.md` |
| Addendum | `_bmad-output/planning-artifacts/brief-2026-08-30/addendum.md` |
| PRD | `_bmad-output/planning-artifacts/prds/prd-Nutrition-2026-08-30/prd.md` |
| PRD addendum | `_bmad-output/planning-artifacts/prds/prd-Nutrition-2026-08-30/addendum.md` |
| Spec canonique | `_bmad-output/specs/spec-nutrition/SPEC.md` |
| Architecture spine | `_bmad-output/planning-artifacts/architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md` |
| Solution design | `_bmad-output/planning-artifacts/architecture/architecture-Nutrition-2026-08-30/SOLUTION-DESIGN.md` |
| UX Design | `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md` |
| UX Experience | `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md` |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` |
| Epics post-MVP | `_bmad-output/planning-artifacts/epics-post-mvp.md` |
| Sources données | `_bmad-output/planning-artifacts/DATA-SOURCES.md` |
| Sprint status | `_bmad-output/implementation-artifacts/sprint-status.yaml` |

## Post-MVP (priorisé 2026-09-01)

Ordre : **E10 → E11 → E9 → E12** — voir `planning-artifacts/epics-post-mvp.md`.

**Cascade recherche unifiée (verrouillée) :**

```
Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA
```

- **E10** — Phases 1 : chunks offline Ciqual + OpenNutrition ; `FoodSearchService` sections 1–3.
- **E11** — Phases 2–3 : providers OFF, FoodRepo, USDA ; cascade complète sections 1–6.
- **E9** — Thème sombre chaleureux (palette nature).
- **E12** — Accueil / onboarding première recette.
- Sources détaillées : `planning-artifacts/DATA-SOURCES.md`.

Toujours hors scope : journal alimentaire repas-par-rep, comptes cloud.

## Hors scope MVP

- Multi-utilisateur, sync cloud, app native
- Comparateur marques avancé, mapping enseignes (epics post-MVP ultérieurs)
- Génération IA de recettes
