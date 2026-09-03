import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { BackupReminderService } from '../../../../core/backup/backup-reminder.service';
import {
  BackupService,
  LARGE_BACKUP_WARNING_BYTES,
} from '../../../../core/backup/backup.service';

@Component({
  selector: 'app-export-page',
  imports: [RouterLink, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './export-page.component.html',
  styleUrl: './export-page.component.scss',
})
export class ExportPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly backupService = inject(BackupService);
  private readonly backupReminder = inject(BackupReminderService);

  readonly exporting = signal(false);
  readonly exportError = signal<string | null>(null);
  readonly exportSuccess = signal<string | null>(null);
  readonly showPlainWarning = signal(false);
  readonly showLargeEncryptWarning = signal(false);
  readonly estimatedExportSize = signal<number | null>(null);

  readonly form = this.fb.group({
    encrypt: [true],
    password: [''],
    confirmPassword: [''],
  });

  get encryptEnabled(): boolean {
    return this.form.controls.encrypt.value === true;
  }

  get passwordMismatch(): boolean {
    if (!this.encryptEnabled) {
      return false;
    }

    const password = this.form.controls.password.value ?? '';
    const confirmPassword = this.form.controls.confirmPassword.value ?? '';
    return password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;
  }

  get canExport(): boolean {
    if (this.exporting()) {
      return false;
    }

    if (this.encryptEnabled) {
      const password = this.form.controls.password.value ?? '';
      const confirmPassword = this.form.controls.confirmPassword.value ?? '';
      return password.length > 0 && password === confirmPassword;
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    this.exportError.set(null);
    this.exportSuccess.set(null);

    if (!this.canExport) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.encryptEnabled) {
      this.showPlainWarning.set(true);
      return;
    }

    const payload = await this.backupService.buildExportPayload();
    const size = this.backupService.estimatePayloadBytes(payload);
    if (size >= LARGE_BACKUP_WARNING_BYTES) {
      this.estimatedExportSize.set(size);
      this.showLargeEncryptWarning.set(true);
      return;
    }

    await this.runExport(true);
  }

  async confirmLargeEncryptExport(): Promise<void> {
    this.showLargeEncryptWarning.set(false);
    await this.runExport(true);
  }

  cancelLargeEncryptExport(): void {
    this.showLargeEncryptWarning.set(false);
  }

  async confirmPlainExport(): Promise<void> {
    this.showPlainWarning.set(false);
    await this.runExport(false);
  }

  cancelPlainExport(): void {
    this.showPlainWarning.set(false);
  }

  private async runExport(encrypt: boolean): Promise<void> {
    this.exporting.set(true);
    this.exportError.set(null);
    this.exportSuccess.set(null);

    try {
      await this.backupService.exportToFile({
        encrypt,
        password: encrypt ? (this.form.controls.password.value ?? undefined) : undefined,
      });
      await this.backupReminder.refresh();
      this.exportSuccess.set('Export terminé — le fichier a été téléchargé.');
    } catch {
      this.exportError.set('Export impossible. Réessayez.');
    } finally {
      this.exporting.set(false);
    }
  }

  formatEstimatedSize(bytes: number | null): string {
    if (bytes == null) {
      return '';
    }

    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }
}
