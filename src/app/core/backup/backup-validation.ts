import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  BACKUP_SCHEMA_VERSION_V1,
  type BackupData,
  type BackupImageBlobRecord,
  type BackupPayload,
  type EncryptedBackupEnvelope,
} from './backup-schema';

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

const BACKUP_DATA_KEYS = [
  'products',
  'productReferences',
  'pantryItems',
  'recipes',
  'recipeVariants',
  'recipeIngredients',
  'mealPlanEntries',
  'shoppingListItems',
  'macroGoals',
  'appSettings',
] as const satisfies ReadonlyArray<keyof BackupData>;

const OPTIONAL_BACKUP_DATA_KEYS = ['imageBlobs'] as const satisfies ReadonlyArray<keyof BackupData>;

export function isEncryptedBackupContent(content: string): boolean {
  try {
    return isEncryptedEnvelope(JSON.parse(content));
  } catch {
    return false;
  }
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedBackupEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate['v'] === 1 &&
    typeof candidate['salt'] === 'string' &&
    typeof candidate['iv'] === 'string' &&
    typeof candidate['ciphertext'] === 'string'
  );
}

function validateBackupData(data: unknown): BackupData {
  if (!data || typeof data !== 'object') {
    throw new BackupValidationError('Données de sauvegarde invalides.');
  }

  const candidate = data as Record<string, unknown>;
  for (const key of BACKUP_DATA_KEYS) {
    if (!Array.isArray(candidate[key])) {
      throw new BackupValidationError(`Champ data.${key} manquant ou invalide.`);
    }
  }

  for (const key of OPTIONAL_BACKUP_DATA_KEYS) {
    if (candidate[key] != null && !Array.isArray(candidate[key])) {
      throw new BackupValidationError(`Champ data.${key} invalide.`);
    }
  }

  const imageBlobs = (candidate['imageBlobs'] as BackupImageBlobRecord[] | undefined) ?? [];

  return {
    ...(candidate as unknown as BackupData),
    imageBlobs,
  };
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') {
    throw new BackupValidationError('Fichier de sauvegarde invalide.');
  }

  const candidate = raw as Record<string, unknown>;
  const schemaVersion = candidate['schemaVersion'];
  if (schemaVersion !== BACKUP_SCHEMA_VERSION && schemaVersion !== BACKUP_SCHEMA_VERSION_V1) {
    throw new BackupValidationError('Version de schéma non supportée.');
  }

  if (candidate['app'] !== BACKUP_APP_ID) {
    throw new BackupValidationError('Application de sauvegarde non reconnue.');
  }

  if (typeof candidate['exportedAt'] !== 'string') {
    throw new BackupValidationError("Date d'export invalide.");
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: candidate['exportedAt'],
    app: BACKUP_APP_ID,
    data: validateBackupData(candidate['data']),
  };
}
