---
title: 'Story 13.6 — Export/import blobs et accessibilité visuelle'
type: 'feature'
created: '2026-09-03'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'a424d1e1d34f7c7148811d1b3b602881ba2e072c'
story_key: '13-6-export-import-blobs-accessibilite'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-1-stockage-blobs-pipeline-webp.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-5-vignettes-off-catalogue-scan.md'
---

Story 13.6 implemented on the same branch/PR as 13.1–13.5.

## Summary

### Export/import blobs (FR-43)

- `BACKUP_SCHEMA_VERSION = 2` with `imageBlobs[]` (base64 WebP records)
- `backup-image-blobs.ts` — encode/decode, collect referenced ids, sanitize missing refs, merge rules for recipe photos and reference thumbs
- Export includes only blobs referenced by recipes (`photoBlobId`) and product references (`thumbBlobId`)
- Import replace/merge restores blobs; summary `photosRestored` / `photosMissing` on `ImportSummary`
- v1 backups accepted without `imageBlobs` (default `[]`)
- Export page warns when payload exceeds 5 Mo before long encryption

### Accessibilité visuelle (FR-45, WCAG)

- `priority-badge` — visible labels Haute/Moyenne/Basse + color dot; tokens `--color-priority-*`
- `shopping-row` — `aria-checked`, checked row styling (primary ink + strikethrough, opacity token)
- Export/import success messages and photo toasts — `aria-live="polite"`

## Verification

- `npm run build` ✅
- `npm test` — **480/480** ✅

### Review Findings

- [ ] [Review][Decision] Résumé import en bloc page statique vs toast éphémère — AC 13.6 dit « toast » ; implémentation = `<div role="status" aria-live>` persistant [`import-page.component.html:17`]
- [ ] [Review][Patch] Compteur `photosRestored` gonflé en merge — compte toutes les FK valides post-fusion, pas seulement celles importées [`database.service.ts:781`]
- [ ] [Review][Patch] Opacité ligne courses 0.85 au lieu de 0.55 (`DESIGN.md` § shopping-row) [`src/styles/_tokens.scss:36`]
- [ ] [Review][Patch] Validation backup v2 superficielle — entrées `imageBlobs` mal formées font échouer tout l'import [`backup-validation.ts:67`, `backup-image-blobs.ts:133`]
- [ ] [Review][Patch] Doublon « Import terminé » dans titre h2 et paragraphe photos [`import-page.component.html:18`]
- [ ] [Review][Patch] `aria-checked` sur `<article>` sans `role` explicite — pattern a11y incomplet [`shopping-row.component.html:5`]
- [x] [Review][Defer] Lacunes de tests d'intégration (merge blobs, round-trip `photoBlobId`, export chiffré > 5 Mo, photo-prompt attach, plan vignettes) — deferred, dette test
