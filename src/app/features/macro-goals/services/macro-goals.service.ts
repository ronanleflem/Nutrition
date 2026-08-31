import { Injectable, inject, signal } from '@angular/core';

import { DatabaseService } from '../../../core/database/database.service';
import type { MacroGoals, UpdateMacroGoalsInput } from '../../../core/models/macro-goals';

@Injectable({ providedIn: 'root' })
export class MacroGoalsService {
  private readonly databaseService = inject(DatabaseService);

  readonly goals = signal<MacroGoals | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const goals = await this.databaseService.getMacroGoals();
      this.goals.set(goals);
    } catch {
      this.loadError.set('Impossible de charger les objectifs.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(input: UpdateMacroGoalsInput): Promise<MacroGoals> {
    const saved = await this.databaseService.updateMacroGoals(input);
    this.goals.set(saved);
    return saved;
  }
}
