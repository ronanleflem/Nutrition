import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DatabaseService } from '../../../../core/database/database.service';

@Component({
  selector: 'app-api-keys-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './api-keys-page.component.html',
  styleUrl: './api-keys-page.component.scss',
})
export class ApiKeysPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly database = inject(DatabaseService);

  readonly saving = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    foodRepoApiKey: [''],
  });

  ngOnInit(): void {
    void this.loadSettings();
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.saveMessage.set(null);
    this.saveError.set(null);

    try {
      const value = this.form.controls.foodRepoApiKey.value.trim();
      await this.database.updateFoodRepoApiKey(value || undefined);
      this.saveMessage.set('Clés enregistrées localement.');
    } catch {
      this.saveError.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.database.getAppSettings();
    this.form.patchValue({
      foodRepoApiKey: settings.foodRepoApiKey ?? '',
    });
  }
}
