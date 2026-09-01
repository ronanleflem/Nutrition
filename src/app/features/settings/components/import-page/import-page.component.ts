import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  BackupService,
  BackupValidationError,
} from '../../../../core/backup/backup.service';
import type { ImportMode, ImportSummary } from '../../../../core/backup/backup-schema';
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

  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);
  readonly showReplaceWarning = signal(false);
  readonly summary = signal<ImportSummary | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly form = this.fb.group({
    mode: ['replace' as ImportMode],
    password: [''],
  });

  get mode(): ImportMode {
    return this.form.controls.mode.value ?? 'replace';
  }

  get requiresPassword(): boolean {
    const file = this.selectedFile();
    return file?.name.endsWith('.nutrition-backup.enc') ?? false;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.summary.set(null);
    this.importError.set(null);
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
