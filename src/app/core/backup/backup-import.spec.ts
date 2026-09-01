import { describe, expect, it } from 'vitest';

import { MACRO_GOALS_SINGLETON_ID } from '../models/macro-goals';
import {
  mergeLastExportAt,
  mergeMacroGoals,
  normalizeMergeKey,
  productNameBrandKey,
} from './backup-merge';
import {
  BackupValidationError,
  isEncryptedBackupContent,
  isEncryptedEnvelope,
  validateBackupPayload,
} from './backup-validation';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION } from './backup-schema';

describe('backup-validation', () => {
  const validPayload = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-09-01T00:00:00.000Z',
    app: BACKUP_APP_ID,
    data: {
      products: [],
      productReferences: [],
      pantryItems: [],
      recipes: [],
      recipeVariants: [],
      recipeIngredients: [],
      mealPlanEntries: [],
      shoppingListItems: [],
      macroGoals: [],
      appSettings: [],
    },
  };

  it('validates a correct payload', () => {
    expect(validateBackupPayload(validPayload)).toEqual(validPayload);
  });

  it('rejects unsupported schema versions', () => {
    expect(() => validateBackupPayload({ ...validPayload, schemaVersion: 99 })).toThrow(
      BackupValidationError,
    );
  });

  it('detects encrypted envelopes', () => {
    expect(
      isEncryptedEnvelope({ v: 1, salt: 'abc', iv: 'def', ciphertext: 'ghi' }),
    ).toBe(true);
    expect(isEncryptedEnvelope(validPayload)).toBe(false);
  });

  it('detects encrypted backup content from JSON string', () => {
    expect(
      isEncryptedBackupContent(
        JSON.stringify({ v: 1, salt: 'abc', iv: 'def', ciphertext: 'ghi' }),
      ),
    ).toBe(true);
    expect(isEncryptedBackupContent(JSON.stringify(validPayload))).toBe(false);
    expect(isEncryptedBackupContent('not-json')).toBe(false);
  });
});

describe('backup-merge helpers', () => {
  it('normalizes merge keys without accents', () => {
    expect(normalizeMergeKey(' Yaourt ')).toBe('yaourt');
    expect(productNameBrandKey('Crème', 'Danone')).toBe('creme|danone');
  });

  it('merges macro goals with import precedence for non-null fields', () => {
    const merged = mergeMacroGoals(
      { id: MACRO_GOALS_SINGLETON_ID, kcal: 2000, proteinG: 120 },
      { id: MACRO_GOALS_SINGLETON_ID, kcal: 2200 },
    );

    expect(merged).toEqual({
      id: MACRO_GOALS_SINGLETON_ID,
      kcal: 2200,
      proteinG: 120,
    });
  });

  it('keeps the most recent lastExportAt', () => {
    expect(mergeLastExportAt('2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe(
      '2026-09-01T00:00:00.000Z',
    );
  });
});
