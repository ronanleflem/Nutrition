import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../core/ui/confirm-dialog/confirm-dialog.component';
import { BackupReminderService } from '../../../../core/backup/backup-reminder.service';
import { BackupService } from '../../../../core/backup/backup.service';

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
  readonly showPlainWarning = signal(false);

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

    if (!this.canExport) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.encryptEnabled) {
      this.showPlainWarning.set(true);
      return;
    }

    await this.runExport(true);
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

    try {
      await this.backupService.exportToFile({
        encrypt,
        password: encrypt ? (this.form.controls.password.value ?? undefined) : undefined,
      });
      await this.backupReminder.refresh();
    } catch {
      this.exportError.set('Export impossible. Réessayez.');
    } finally {
      this.exporting.set(false);
    }
  }
}
