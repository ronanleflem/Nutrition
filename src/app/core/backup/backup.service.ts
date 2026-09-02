import { Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { BackupCryptoService } from './backup-crypto.service';
import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  type BackupData,
  type BackupPayload,
  type ImportMode,
  type ImportSummary,
} from './backup-schema';
import { triggerFileDownload } from './file-download';
import { sanitizeAppSettingsForExport } from './backup-export-sanitize';
import {
  BackupValidationError,
  isEncryptedEnvelope,
  validateBackupPayload,
} from './backup-validation';

export interface ExportBackupOptions {
  encrypt: boolean;
  password?: string;
}

export interface ImportBackupOptions {
  mode: ImportMode;
  password?: string;
}

export { BackupValidationError } from './backup-validation';

@Injectable({ providedIn: 'root' })
export class BackupService {
  constructor(
    private readonly database: DatabaseService,
    private readonly crypto: BackupCryptoService,
  ) {}

  async buildExportPayload(): Promise<BackupPayload> {
    const data = await this.database.dumpAllTables();

    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      app: BACKUP_APP_ID,
      data: {
        ...data,
        appSettings: data.appSettings.map(sanitizeAppSettingsForExport),
      },
    };
  }

  async exportToFile(options: ExportBackupOptions): Promise<void> {
    const payload = await this.buildExportPayload();
    const exportedAt = payload.exportedAt;
    const datePart = exportedAt.slice(0, 10);

    try {
      if (options.encrypt) {
        if (!options.password) {
          throw new Error('Mot de passe requis.');
        }

        const envelope = await this.crypto.encrypt(JSON.stringify(payload), options.password);
        const blob = new Blob([JSON.stringify(envelope)], { type: 'application/json' });
        triggerFileDownload(blob, `nutrition-backup-${datePart}.nutrition-backup.enc`);
      } else {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        triggerFileDownload(blob, `nutrition-backup-${datePart}.nutrition-backup.json`);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Mot de passe requis.') {
        throw error;
      }

      throw new Error('Téléchargement impossible. Réessayez.');
    }

    await this.database.updateLastExportAt(exportedAt);
  }

  async parseFileContent(content: string, password?: string): Promise<BackupPayload> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new BackupValidationError('Fichier JSON invalide.');
    }

    let payloadRaw: unknown;
    if (isEncryptedEnvelope(parsed)) {
      if (!password) {
        throw new BackupValidationError('Mot de passe requis pour ce fichier chiffré.');
      }

      try {
        const decrypted = await this.crypto.decrypt(parsed, password);
        try {
          payloadRaw = JSON.parse(decrypted);
        } catch {
          throw new BackupValidationError('Fichier de sauvegarde invalide après déchiffrement.');
        }
      } catch (error) {
        if (error instanceof BackupValidationError) {
          throw error;
        }

        throw new BackupValidationError('Mot de passe incorrect.');
      }
    } else {
      payloadRaw = parsed;
    }

    return validateBackupPayload(payloadRaw);
  }

  async importFromFile(file: File, options: ImportBackupOptions): Promise<ImportSummary> {
    const content = await file.text();
    const payload = await this.parseFileContent(content, options.password);

    if (options.mode === 'replace') {
      await this.database.replaceAllFromBackup(payload.data);
      return this.buildReplaceSummary(payload.data);
    }

    return this.database.mergeFromBackup(payload.data);
  }

  private buildReplaceSummary(data: BackupData): ImportSummary {
    return {
      mode: 'replace',
      products: data.products.length,
      productReferences: data.productReferences.length,
      pantryItems: data.pantryItems.length,
      recipes: data.recipes.length,
      recipeVariants: data.recipeVariants.length,
      mealPlanEntries: data.mealPlanEntries.length,
      shoppingListItems: data.shoppingListItems.length,
    };
  }
}
