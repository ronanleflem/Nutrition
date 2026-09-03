---
title: 'Story 13.3 — Affichage recettes et plan (vignettes, hero, placeholder)'
type: 'feature'
created: '2026-09-03'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '152c9c9'
story_key: '13-3-affichage-recettes-plan-vignettes'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-1-stockage-blobs-pipeline-webp.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-2-photo-recette-prompt-et-crud.md'
---

Story 13.3 implemented on the same branch/PR as 13.1–13.2.

## Summary

- Shared `RecipePhotoPlaceholderComponent` (plate SVG, `aria-hidden`)
- `RecipePhotoThumbComponent` loads blobs via `resource()` + `ImageBlobService`; sizes `list` (72px), `plan` (40px), `hero` (180px)
- Recipes list: `recipe-card` layout with thumb left, title + variant right
- Recipe detail: `recipe-hero` with photo or placeholder; `alt` = recipe title when photo present
- Meal plan week grid: `plan-slot-thumb` on filled slots; empty slot `+` uses `--color-ink-secondary`
- Shopping mode unchanged — no recipe thumbnails (FR-44)

## Verification

- `npm run build` ✅ (budget warning on recipe-detail SCSS, pre-existing pattern)
- `npm test` — 460/460 ✅
