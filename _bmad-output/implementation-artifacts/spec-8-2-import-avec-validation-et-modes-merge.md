---
title: 'Story 8.2 — Import avec validation et modes merge'
type: 'feature'
created: '2026-09-01'
status: 'in-review'
review_loop_iteration: 0
story_key: '8-2-import-avec-validation-et-modes-merge'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot restore backups or merge data from another device; export alone is insufficient for migration.

**Approach:** Extend `BackupService` with file parsing, schema validation, optional decryption, and two import modes (`replace` / `merge`) implemented in `DatabaseService`. Expose via Settings → Import with post-import summary.

## Boundaries & Constraints

**Always:**
- Validate `schemaVersion`, `app`, and all `data` table arrays before any write.
- Wrong password on encrypted file → fail without altering current data.
- Replace mode: truncate all tables then bulk insert.
- Merge mode: PRD §10 rules (products by barcode/name+brand, pantry addition, recipes replace, mealPlan upsert, shopping skip, macroGoals merge, lastExportAt max).
- French UI; post-import summary displayed.

**Ask First:** None.

**Never:**
- Import without prior validation.
- Backend upload or cloud sync.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Replace import | Valid JSON backup | All data replaced; summary shown | N/A |
| Merge import | Valid JSON + local data | Merge rules applied; summary with add/update counts | N/A |
| Wrong password | Encrypted file | No data change | French error message |
| Invalid schema | Malformed JSON | No data change | Validation error |
| Replace confirm cancelled | User cancels dialog | No import | N/A |

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] `backup-validation.ts` — schema validation.
- [x] `backup-merge.ts` — merge helpers.
- [x] `database.service.ts` — `replaceAllFromBackup`, `mergeFromBackup`.
- [x] `backup.service.ts` — `parseFileContent`, `importFromFile`.
- [x] `import-page/` — UI with mode selection, password, summary.
- [x] Tests: validation, merge pantry, wrong password, round-trip replace.

**Acceptance Criteria:**
- Given a valid backup, when I import in replace mode, then all local data matches the file.
- Given merge mode, when products share a barcode, then pantry quantities are summed.
- Given wrong password on encrypted file, then current data is unchanged.
- Given successful import, then a summary is displayed.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build` — succeeds.
