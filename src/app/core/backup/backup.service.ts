import { Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { BackupCryptoService } from './backup-crypto.service';
import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  type BackupPayload,
} from './backup-schema';
import { triggerFileDownload } from './file-download';

export interface ExportBackupOptions {
  encrypt: boolean;
  password?: string;
}

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
      data,
    };
  }

  async exportToFile(options: ExportBackupOptions): Promise<void> {
    const payload = await this.buildExportPayload();
    const exportedAt = payload.exportedAt;
    const datePart = exportedAt.slice(0, 10);

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

    await this.database.updateLastExportAt(exportedAt);
  }
}
