---
title: 'Story 13.7 — Illustrations forêt et ambiance maison'
type: 'feature'
created: '2026-09-03'
status: 'in-review'
story_key: '13-7-illustrations-foret-ambiance-maison'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md'
---

Story 13.7 enrichit la couche visuelle « maison » livrée en 13.4 : bandeaux illustrés palette forêt, fond de page discret, placeholder recette aligné.

## Summary

- `surface-banner` : scènes remplies (collines, feuillage, étagères/bocaux, plat/planche, calendrier/table) avec dégradé forêt
- Tokens illustration `--color-forest-scene-*`
- Fond halo discret sur Garde-manger / Recettes / Plan (`_home-surface-page.scss`)
- `recipe-photo-placeholder` et `photo-prompt` : même main graphique que le bandeau Recettes

## Verification

- `npm run build` ✅
- `npm test` — surface-banner + pages ciblées ✅
