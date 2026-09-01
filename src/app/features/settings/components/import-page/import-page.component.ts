import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BackupReminderService } from '../../../../core/backup/backup-reminder.service';
import {
  BackupService,
  BackupValidationError,
} from '../../../../core/backup/backup.service';
import type { ImportMode, ImportSummary } from '../../../../core/backup/backup-schema';
import { isEncryptedBackupContent } from '../../../../core/backup/backup-validation';
import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-import-page',
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.scss',
})
export class ImportPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly backupService = inject(BackupService);
  private readonly backupReminder = inject(BackupReminderService);

  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);
  readonly showReplaceWarning = signal(false);
  readonly summary = signal<ImportSummary | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly fileIsEncrypted = signal(false);

  readonly form = this.fb.group({
    mode: ['replace' as ImportMode],
    password: [''],
  });

  get mode(): ImportMode {
    return this.form.controls.mode.value ?? 'replace';
  }

  get requiresPassword(): boolean {
    return this.fileIsEncrypted();
  }

  get canImport(): boolean {
    if (this.importing() || !this.selectedFile()) {
      return false;
    }

    if (this.requiresPassword) {
      return (this.form.controls.password.value ?? '').length > 0;
    }

    return true;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.summary.set(null);
    this.importError.set(null);
    this.form.controls.password.setValue('');

    if (!file) {
      this.fileIsEncrypted.set(false);
      return;
    }

    const content = await file.text();
    this.fileIsEncrypted.set(
      isEncryptedBackupContent(content) || file.name.endsWith('.nutrition-backup.enc'),
    );
  }

  async onSubmit(): Promise<void> {
    this.importError.set(null);
    this.summary.set(null);

    if (!this.canImport || !this.selectedFile()) {
      return;
    }

    if (this.mode === 'replace') {
      this.showReplaceWarning.set(true);
      return;
    }

    await this.runImport();
  }

  async confirmReplaceImport(): Promise<void> {
    this.showReplaceWarning.set(false);
    await this.runImport();
  }

  cancelReplaceImport(): void {
    this.showReplaceWarning.set(false);
  }

  private async runImport(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.importing.set(true);
    this.importError.set(null);

    try {
      const result = await this.backupService.importFromFile(file, {
        mode: this.mode,
        password: this.form.controls.password.value || undefined,
      });
      this.summary.set(result);
      await this.backupReminder.refresh();
    } catch (error) {
      if (error instanceof BackupValidationError) {
        this.importError.set(error.message);
      } else {
        this.importError.set('Import impossible. Réessayez.');
      }
    } finally {
      this.importing.set(false);
    }
  }
}
