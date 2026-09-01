---
title: 'Story 8.3 — Rappel backup 30 jours'
type: 'feature'
created: '2026-09-01'
status: 'in-review'
review_loop_iteration: 0
story_key: '8-3-rappel-backup-30-jours'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users forget to back up and risk data loss without a nudge.

**Approach:** On app open, if `lastExportAt` is missing or ≥ 30 days old, show a discrete dismissable banner in the shell with a link to Export. Persist dismiss in `appSettings.backupReminderDismissedAt`.

## Boundaries & Constraints

**Always:**
- Check on app bootstrap via `BackupReminderService.refresh()`.
- Banner in shell (not store mode / hidden chrome).
- Link to `/settings/export`; dismiss button in French.
- No reminder if export within 30 days.
- Export clears dismiss snooze via `updateLastExportAt`.

**Never:**
- Blocking modal; must be dismissable.

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] `backup-reminder.ts` — stale/dismiss logic.
- [x] `BackupReminderService` + `dismissBackupReminder()` on DatabaseService.
- [x] `backup-reminder-banner` in shell.
- [x] App initializer refresh; export page refresh after export.
- [x] Tests.

**Acceptance Criteria:**
- Given no export for ≥ 30 days, when I open the app, then a reminder with Export link appears.
- Given I dismiss it, then it hides until snooze expires or I export.
- Given recent export, then no reminder.

## Verification

**Commands:**
- `npm test` — all pass.
- `npm run build` — succeeds.
