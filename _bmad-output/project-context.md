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
4. **APIs externes** — Open Food Facts uniquement, GET, pas d’envoi de données perso.
5. **Mobile-first** — UI pensée pour usage en magasin (gros touch targets, mode liste courses).
6. **Pas d’auth** — pas de login, pas de JWT, pas de compte.
7. **Conventions Angular** — standalone components, signals où pertinent, lazy routes par feature.
8. **Langue** — UI et messages en français.
9. **Unités** — grammes uniquement ; macros produits normalisées pour 100 g.
10. **Scan code-barres** — `@zxing/ngx-scanner` + lookup Open Food Facts ; toujours proposer saisie manuelle en repli (iOS).
11. **Objectifs macros** — entité `MacroGoals` locale ; comparer le total du plan de repas du jour aux cibles.

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
| PRD | `_bmad-output/planning-artifacts/prd.md` (à créer) |
| Architecture | `_bmad-output/planning-artifacts/ARCHITECTURE-SPINE.md` (à créer) |

## Hors scope MVP

- Multi-utilisateur, sync cloud, app native
- Comparateur marques avancé, mapping enseignes (epics post-MVP)
- Génération IA de recettes
