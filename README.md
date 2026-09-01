# Nutrition

Application personnelle pour faciliter une alimentation saine : garde-manger, recettes, planification des repas et listes de courses intelligentes.

## Principes

- **100 % local** — données sur ton téléphone (PWA Angular + IndexedDB)
- **Sauvegarde** — export / import JSON (chiffrement optionnel)
- **Pas de cloud** au MVP — pas de compte, pas de serveur exposé
- **BMAD** — planning structuré avec la [BMad Method](https://bmadcode.com/)

## Stack (cible)

| Composant | Technologie |
|-----------|-------------|
| Frontend | Angular 22 PWA |
| Stockage | IndexedDB |
| Enrichissement | Open Food Facts (lecture seule) |

## Application Angular

Prérequis : Node.js ≥ 22.22.3 (Angular CLI 22).

```bash
npm install
npm start      # dev server http://localhost:4200
npm run build  # build production + service worker
npm run build:pages  # build pour GitHub Pages (/Nutrition/)
```

Routes lazy disponibles : `/pantry`, `/products`, `/recipes`, `/plan`, `/shopping`, `/goals`, `/settings`.

## Démo sur téléphone (GitHub Pages)

Après activation dans le dépôt GitHub (**Settings → Pages → Build and deployment → Source : GitHub Actions**), l’app est publiée à :

**https://ronanleflem.github.io/Nutrition/**

Chaque push sur `main` redéploie automatiquement (workflow `Deploy GitHub Pages`). Sur le téléphone : ouvrir l’URL → menu du navigateur → **Ajouter à l’écran d’accueil** pour l’installer en PWA.

Le scan caméra fonctionne (HTTPS). Les données restent locales dans IndexedDB sur l’appareil.

Pour tester le shell offline : `npm run build` puis servir `dist/nutrition/browser` (ex. `npx http-server dist/nutrition/browser`) et couper le réseau après la première visite.

**Service worker :** en production, le SW s’enregistre via `registerWhenStable:30000` (au plus 30 s après stabilisation de l’app). La première visite doit rester en ligne assez longtemps pour que le SW installe le shell et les chunks lazy. `navigationRequestStrategy: freshness` tente le réseau avant le cache pour les navigations — hors ligne, le shell utilise le cache après installation du SW.

## Démarrage BMAD

Dans Cursor, invoquer les skills :

1. `bmad-help` — quelle est la prochaine étape ?
2. `bmad-create-prd` — PRD depuis le brief
3. `bmad-create-architecture` — architecture technique
4. `bmad-build` — implémenter une story

## Artefacts

| Document | Chemin |
|----------|--------|
| Brief produit | `_bmad-output/planning-artifacts/brief-2026-08-30/brief.md` |
| PRD | `_bmad-output/planning-artifacts/prds/prd-Nutrition-2026-08-30/prd.md` |
| Contexte projet | `_bmad-output/project-context.md` |
| Instructions agents | `AGENTS.md` |

## Installation BMAD (déjà faite)

```bash
npx bmad-method install --yes --tools cursor --modules core,bmm
```

Nécessite `uv` pour les skills `bmad-build` : https://docs.astral.sh/uv/
