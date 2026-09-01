import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { shouldShowBackupReminder } from './backup-reminder';

@Injectable({ providedIn: 'root' })
export class BackupReminderService {
  private readonly database = inject(DatabaseService);

  readonly visible = signal(false);

  async refresh(): Promise<void> {
    const settings = await this.database.getAppSettings();
    this.visible.set(shouldShowBackupReminder(settings));
  }

  async dismiss(): Promise<void> {
    await this.database.dismissBackupReminder();
    await this.refresh();
  }
}
