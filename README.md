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
| Frontend | Angular PWA |
| Stockage | IndexedDB |
| Enrichissement | Open Food Facts (lecture seule) |

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
| Contexte projet | `_bmad-output/project-context.md` |
| Instructions agents | `AGENTS.md` |

## Installation BMAD (déjà faite)

```bash
npx bmad-method install --yes --tools cursor --modules core,bmm
```

Nécessite `uv` pour les skills `bmad-build` : https://docs.astral.sh/uv/
