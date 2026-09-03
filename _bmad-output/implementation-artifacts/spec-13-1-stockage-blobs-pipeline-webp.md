---
title: 'Story 13.1 — Stockage blobs et pipeline image WebP'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '81955636f52c615e461d1ea5aa8adc1a36168ea1'
story_key: '13-1-stockage-blobs-pipeline-webp'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-13-context.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recipe photos and OFF product thumbnails have no local blob storage or client-side WebP pipeline, so later visual stories (13.2–13.6) cannot persist or display images offline.

**Approach:** Add Dexie v11 `imageBlobs` table, optional FK fields on `Recipe` and `ProductReference`, a pure WebP resize pipeline, and an `ImageBlobService` with store/get/delete plus orphan cleanup when a blob id is replaced or cleared.

## Boundaries & Constraints

**Always:**
- Local-first: blobs in IndexedDB only; MIME stored as `image/webp`.
- Dexie access only via `DatabaseService`; features use `ImageBlobService`.
- Client resize at import: max width 1200 px, WebP quality 0.82; no crop UI.
- Bump `NUTRITION_DB_VERSION` to 11 with additive `imageBlobs` store.
- Unit tests: pipeline edge cases + service round-trip store/get/delete.

**Ask First:**
- Changing max width/quality defaults.
- Export/import blob serialization (story 13.6).

**Never:**
- Network fetch for user images.
- Backup schema changes in this story.
- UI components (photo-prompt, cards, banners) — stories 13.2+.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Store image | Valid image `File`/`Blob` | WebP blob persisted; returns UUID id | Reject non-image MIME |
| Get blob | Known id | `Blob` with `image/webp` | `undefined` if missing |
| Delete blob | Known id | Row removed from `imageBlobs` | Idempotent if already gone |
| Replace photo | New file + previous `photoBlobId` | New id stored; old blob deleted if unreferenced | Keep old blob if delete fails silently |
| Resize large | Image wider than 1200 px | Scaled down; height proportional | N/A |
| Small image | Image ≤ 1200 px | Re-encoded WebP without upscale | N/A |
| Invalid input | Non-image MIME | No store | Throw descriptive error |

</frozen-after-approval>

## Code Map

- `src/app/core/database/nutrition-database.ts` — bump v11; add `imageBlobs: 'id, mimeType, createdAt'`.
- `src/app/core/database/database.service.ts` — `putImageBlob`, `getImageBlob`, `deleteImageBlob`; mirror `putUsdaFoodCacheEntry` pattern (~L286).
- `src/app/core/models/image-blob.ts` — `ImageBlob` record (`id`, `mimeType`, `data`, `createdAt`).
- `src/app/core/models/recipe.ts` — add optional `photoBlobId?: string`.
- `src/app/core/models/product-reference.ts` — add optional `thumbBlobId?: string`.
- `src/app/core/images/image-webp.pipeline.ts` — pure `resizeImageToWebp(file, opts)` via canvas + `createImageBitmap`.
- `src/app/core/images/image-blob.service.ts` — `storeFromFile`, `get`, `delete`, `replace` (store + delete old if unreferenced).
- `src/app/core/usda-fdc/usda-food-cache.service.ts` — thin-facade pattern to copy.
- `src/test-setup.ts` — `fake-indexeddb/auto` already loaded.
- Backup (`backup-schema.ts`, `backup.service.ts`) — read-only; FK fields serialize in JSON but blob bytes deferred to 13.6.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/models/image-blob.ts` — define `ImageBlob` model and constants (`IMAGE_WEBP_MIME`).
- [x] `src/app/core/database/nutrition-database.ts` — Dexie v11 `imageBlobs` table.
- [x] `src/app/core/database/database.service.ts` — CRUD methods for image blobs.
- [x] `src/app/core/images/image-webp.pipeline.ts` — client resize/WebP encode.
- [x] `src/app/core/images/image-blob.service.ts` — orchestrate pipeline + DB + orphan delete on replace.
- [x] `src/app/core/models/recipe.ts` — `photoBlobId?: string`.
- [x] `src/app/core/models/product-reference.ts` — `thumbBlobId?: string`.
- [x] `src/app/core/images/image-webp.pipeline.spec.ts` — matrix rows: resize large, small, invalid MIME.
- [x] `src/app/core/images/image-blob.service.spec.ts` — round-trip store/get/delete + replace orphan cleanup.

**Acceptance Criteria:**
- Given Dexie v11, when `ImageBlobService.storeFromFile` receives a valid image, then a row exists in `imageBlobs` with MIME `image/webp` and a UUID id is returned.
- Given a stored blob id, when `ImageBlobService.get` is called, then the WebP blob is returned; unknown id yields `undefined`.
- Given a stored blob id, when `ImageBlobService.delete` is called, then the row is removed.
- Given a replace with a previous blob id, when the old id is unreferenced, then the old blob row is deleted.
- Given unit tests run via `npm test`, then pipeline and service specs pass.

## Spec Change Log

## Design Notes

- `ImageBlob.data` stores the raw `Blob` (Dexie/IndexedDB native support).
- `replace(oldId, file)` is the primitive for 13.2 photo change flows; entity FK updates remain in feature/DB layers.
- Default `maxWidth: 1200`, `quality: 0.82` — balance size vs quality for mobile PWA.

## Verification

**Commands:**
- `npm test -- --run src/app/core/images` — expected: all image pipeline and service tests pass.
- `npm run build` — expected: production build succeeds.

### Review Findings

- [ ] [Review][Patch] Fichiers sans type MIME rejetés par le pipeline [`src/app/core/images/image-webp.pipeline.ts:21`]
- [ ] [Review][Patch] Import merge : blobs orphelins non supprimés après remplacement de FK [`src/app/core/database/database.service.ts:506`]
- [x] [Review][Defer] Orientation EXIF non appliquée — photos mobile potentiellement penchées [`src/app/core/images/image-webp.pipeline.ts:28`] — deferred, hors scope spec 13.1
- [x] [Review][Defer] Pas de limite de taille avant décodage canvas — risque mémoire sur très gros fichiers [`src/app/core/images/image-webp.pipeline.ts:28`] — deferred, amélioration post-MVP
