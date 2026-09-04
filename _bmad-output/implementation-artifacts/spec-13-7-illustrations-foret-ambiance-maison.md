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

Story 13.7 enrichit la couche visuelle « maison » : thème forêt assumé sur les onglets maison (ambiance shell, cartes teintées, bandeaux panoramiques), pas seulement des illustrations isolées.

## Summary

- `app-forest-ambience` : paysage décoratif fixe sur Garde-manger, Recettes, Plan, Produits (`shell--maison`)
- Shell header + bottom-nav teintés forêt en mode maison
- `forest-maison-card` / `forest-maison-empty-state` : cartes et états vides cohérents
- `surface-banner` : pleine largeur, scènes plus immersives
- Fond halo renforcé (`_home-surface-page.scss`, incl. catalogue Produits)
- Tokens `--color-forest-scene-sky-*`

## Verification

- `npm run build` ✅
- `npm test` — surface-banner + pages ciblées ✅
