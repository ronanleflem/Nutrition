---
title: 'Story 13.2 — Photo recette — prompt et CRUD'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '678a942'
story_key: '13-2-photo-recette-prompt-et-crud'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-1-stockage-blobs-pipeline-webp.md'
---

Story 13.2 implemented on the same branch/PR as 13.1.

## Summary

- `photo-prompt` screen after recipe creation (form + onboarding omelette/custom)
- Onboarding completes only after prompt (`Plus tard` or successful photo)
- Recipe detail photo menu: Ajouter / Changer / Retirer
- `RecipePhotoService` orchestrates blob attach/replace/remove with UX error messages

## Verification

- `npm run build` ✅
- `npm test` — 458/458 ✅
