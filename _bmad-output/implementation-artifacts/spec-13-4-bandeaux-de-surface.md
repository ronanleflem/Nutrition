---
title: 'Story 13.4 — Bandeaux de surface'
type: 'feature'
created: '2026-09-03'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '866ab6e7bb5a364dc250c1317611ab977df7ce45'
story_key: '13-4-bandeaux-de-surface'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
---

Story 13.4 implemented on the same branch/PR as 13.1–13.3.

## Summary

- Shared `SurfaceBannerComponent` with static SVG scenes per surface (`pantry` étagères/bocaux, `recipes` plat/planche, `plan` semaine/table)
- Banner ~100 px, palette forêt, `aria-hidden`, coexists with `EmptyState` on listes vides
- Integrated on Garde-manger, Recettes (liste) and Plan — absent on sous-écrans, Accueil, onboarding, Mode Courses, Objectifs, Paramètres (FR-42, FR-44)

## Verification

- `npm run build` ✅
- `npm test` ✅
