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

### Review Findings

- [x] [Review][Patch] Refus galerie non géré — `RECIPE_PHOTO_GALLERY_DENIED` défini mais jamais affiché ; AC 13.2 « galerie refusée → Plus tard + message » [`src/app/features/recipes/components/photo-prompt-page/photo-prompt-page.component.ts:148`]
- [x] [Review][Patch] Message échec remplacement incomplet — AC exige le même message qu'à l'ajout ; `RECIPE_PHOTO_REPLACE_ERROR` omet « La recette est sauvegardée. » [`src/app/core/images/recipe-photo.messages.ts:2`]
- [x] [Review][Patch] `probeCameraAvailability()` appelle `getUserMedia` au chargement de l'écran, avant action utilisateur [`src/app/core/images/camera-capability.ts:9`]
- [x] [Review][Defer] SVG placeholder dupliqué au lieu de `RecipePhotoPlaceholderComponent` [`photo-prompt-page.component.html:12`] — deferred, cohérence visuelle mineure
