# Epic 8 Context: Sauvegarde et restauration

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Let users export and import all local app data as a versioned JSON file with optional AES-GCM encryption, so they can migrate devices or recover from data loss without any cloud account or backend.

## Stories

- Story 8.1: Export JSON avec chiffrement optionnel
- Story 8.2: Import avec validation et modes merge
- Story 8.3: Rappel backup 30 jours

## Requirements & Constraints

- Export must include every MVP IndexedDB table: products (including archived), productReferences, pantryItems, recipes, recipeVariants, recipeIngredients, mealPlanEntries, shoppingListItems, macroGoals, appSettings.
- JSON envelope: `schemaVersion`, `exportedAt`, `app`, `data` object with all tables.
- Optional encryption via Web Crypto (PBKDF2 + AES-GCM); encrypted files use `.nutrition-backup.enc`.
- Unencrypted export allowed only with an explicit user warning (NFR-6).
- After successful export, update `appSettings.lastExportAt`.
- Import (Story 8.2): validate schema before write; replace-all or merge modes per PRD rules; wrong password must not alter current data.
- Backup reminder (Story 8.3): discrete dismissable prompt when no export for ≥ 30 days.
- French UI; local-first; no network required for backup operations.
- Feature home: `settings` route; `BackupService` in `core/backup`.

## Technical Decisions

- `BackupService` isolated from UI — export/import/crypto logic in `core/backup/`.
- `BACKUP_SCHEMA_VERSION = 1` (distinct from Dexie `NUTRITION_DB_VERSION`).
- Encrypted envelope: `{ v: 1, salt, iv, ciphertext }` (base64-encoded binary fields).
- Plain JSON matches PRD addendum shape; include `pantryItems` in `data`.
- `DatabaseService` remains the IndexedDB gateway; backup reads via `toArray()` on all tables.
- File download via Blob + temporary `<a download>` — first file I/O in the app.

## UX & Interaction Patterns

- Settings → Export / Import / About (French labels).
- Export screen: encryption toggle, password fields when enabled, explicit warning before unencrypted export.
- Import screen (8.2): file picker, mode selection, summary after restore.

## Cross-Story Dependencies

- Depends on all prior epics' data models being stable in Dexie.
- Story 8.2 consumes export format from 8.1; Story 8.3 reads `lastExportAt` set by 8.1.
