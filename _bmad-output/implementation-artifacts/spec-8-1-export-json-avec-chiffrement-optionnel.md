---
title: 'Story 8.1 — Export JSON avec chiffrement optionnel'
type: 'feature'
created: '2026-09-01'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '60728d8efb5dba91d2838f09a75552a984c5e2ef'
story_key: '8-1-export-json-avec-chiffrement-optionnel'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-Nutrition-2026-08-30/addendum.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot back up local data before changing devices or reinstalling; all nutrition data would be lost without an export path.

**Approach:** Add `BackupService` in `core/backup` to dump all Dexie tables into a versioned JSON payload, optionally encrypt with PBKDF2 + AES-GCM (Web Crypto), trigger browser download, and update `appSettings.lastExportAt`. Expose via Settings → Export page with encryption toggle and unencrypted warning.

## Boundaries & Constraints

**Always:**
- Export envelope: `schemaVersion: 1`, `exportedAt` ISO, `app: "nutrition"`, `data` with all 10 MVP tables.
- Include archived products (`deletedAt` set) via raw `products.toArray()`.
- Encrypted download extension `.nutrition-backup.enc`; envelope `{ v: 1, salt, iv, ciphertext }` (base64).
- Unencrypted export requires explicit confirmation dialog warning data is readable.
- On successful download, persist `lastExportAt` on appSettings singleton.
- French UI; mobile-first; offline-capable.
- `BackupService` isolated in `core/backup/`; no import logic (Story 8.2).

**Ask First:** None.

**Never:**
- Backend upload, cloud sync, or sending backup data to third parties.
- Import/merge/replace logic in this story.
- Weakening encryption (no custom crypto; Web Crypto only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Encrypted export | Password set, encryption on | `.nutrition-backup.enc` downloaded; `lastExportAt` updated | Wrong password N/A at export |
| Plain export confirmed | Encryption off + user confirms warning | `.nutrition-backup.json` downloaded; `lastExportAt` updated | N/A |
| Plain export cancelled | Encryption off + user cancels dialog | No download; `lastExportAt` unchanged | N/A |
| Empty password encrypted | Encryption on, empty password | Export blocked; inline validation message | Disable submit |
| Password mismatch | Encryption on, confirm ≠ password | Export blocked; inline validation | Disable submit |
| Export failure | DB read throws | Error message shown; no download; `lastExportAt` unchanged | French error text |
| All tables present | Any data state | JSON `data` keys: products, productReferences, pantryItems, recipes, recipeVariants, recipeIngredients, mealPlanEntries, shoppingListItems, macroGoals, appSettings | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/database/nutrition-database.ts` — 10 Dexie tables; `NUTRITION_DB_VERSION` ≠ backup `schemaVersion`.
- `src/app/core/database/database.service.ts` — add `dumpAllTables()`, `updateLastExportAt()`; pattern at L1133–1137 for `appSettings.put`.
- `src/app/core/models/app-settings.ts` — `lastExportAt?: string` (L8).
- `src/app/features/settings/settings.routes.ts` — add `export` child route.
- `src/app/features/settings/settings-page.component.html` — nav link to export.
- `src/app/features/settings/components/archived-products-page/` — sub-page pattern (back link, loading, errors).
- `src/app/core/ui/confirm-dialog/` — unencrypted export confirmation.
- `src/app/features/macro-goals/macro-goals-page.component.ts` — form + async submit pattern.

**Create:**
- `src/app/core/backup/backup-schema.ts` — `BACKUP_SCHEMA_VERSION`, types.
- `src/app/core/backup/backup-crypto.service.ts` — PBKDF2 + AES-GCM encrypt.
- `src/app/core/backup/file-download.ts` — `triggerFileDownload(blob, filename)`.
- `src/app/core/backup/backup.service.ts` — `buildExportPayload()`, `exportToFile()`.
- `src/app/features/settings/components/export-page/` — export UI.
- Unit tests for crypto round-trip, payload shape, export page validation.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/backup/backup-schema.ts` — schema version + payload/envelope types.
- [x] `src/app/core/backup/backup-crypto.service.ts` — encrypt JSON string to envelope.
- [x] `src/app/core/backup/file-download.ts` — browser download helper.
- [x] `src/app/core/backup/backup.service.ts` — dump tables, build payload, export file, update `lastExportAt`.
- [x] `src/app/core/database/database.service.ts` — `dumpAllTables()`, `updateLastExportAt()`.
- [x] `src/app/features/settings/components/export-page/` — export UI with encryption toggle, password fields, warnings.
- [x] `src/app/features/settings/settings.routes.ts` — register export route.
- [x] `src/app/features/settings/settings-page.component.html` — link to export.
- [x] Tests: backup service payload, crypto round-trip, export page validation.

**Acceptance Criteria:**
- Given Settings → Export, when I export with encryption and a valid password, then a `.nutrition-backup.enc` file downloads and `lastExportAt` is updated.
- Given Settings → Export, when I export without encryption and confirm the warning, then a `.nutrition-backup.json` file downloads.
- Given an export file, then it contains `schemaVersion`, `exportedAt`, and `data` with all MVP tables including `productReferences` and `recipeVariants`.
- Given encryption enabled, when password is empty or confirmation mismatches, then export is blocked with validation feedback.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build` — succeeds.

**Manual checks:**
- Settings → Exporter: encrypted and plain flows; verify downloaded JSON structure in devtools.

## Spec Change Log

## Design Notes

- `macroGoals` and `appSettings` exported as arrays from Dexie (`toArray()`), matching other tables; consumers normalize on import (8.2).
- PBKDF2: 100k iterations, SHA-256, 16-byte salt; AES-GCM 256-bit key, 12-byte IV — standard Web Crypto defaults.
- Filename pattern: `nutrition-backup-YYYY-MM-DD` + extension.
