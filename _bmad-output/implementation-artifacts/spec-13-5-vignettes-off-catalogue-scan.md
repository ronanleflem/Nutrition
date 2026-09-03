---
title: 'Story 13.5 — Vignettes OFF catalogue et preview scan'
type: 'feature'
created: '2026-09-03'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '0e312c0e7bb5a364dc250c1317611ab977df7ce45'
story_key: '13-5-vignettes-off-catalogue-scan'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-13-1-stockage-blobs-pipeline-webp.md'
---

Story 13.5 implemented on the same branch/PR as 13.1–13.4.

## Summary

- `OffProductPrefill.imageUrl` mapped from OFF API (`image_front_*` / `image_*` fields)
- `OffProductThumbService` fetches OFF image at import time and stores local WebP blob (`thumbBlobId`)
- `ProductThumbComponent` — 72 px `cover`, decorative `alt=""`, category picto fallback
- `product-card` layout with thumb left (preferred ref OFF image or picto)
- Scan/import preview on `scan-reference-page` (OFF URL before save, picto otherwise)

## Verification

- `npm run build` ✅
- `npm test` — **472/472** ✅

### Review Findings

- [x] [Review][Patch] Fetch OFF sans timeout — soumission scan peut rester bloquée indéfiniment [`src/app/core/images/off-product-thumb.service.ts:18`]
- [x] [Review][Defer] Vignette OFF importée uniquement via flux scan — pas d'autres points d'entrée catalogue identifiés [`scan-reference-page.component.ts:137`] — deferred, à confirmer si d'autres flux catalogue existent
