import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';

import type { UpdateMacroGoalsInput } from '../../core/models/macro-goals';
import { MacroSynthesisSectionComponent } from './components/macro-synthesis-section/macro-synthesis-section.component';
import { MacroGoalsService } from './services/macro-goals.service';

function optionalMinZeroValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value) >= 0 ? null : { min: true };
}

@Component({
  selector: 'app-macro-goals-page',
  imports: [ReactiveFormsModule, MacroSynthesisSectionComponent],
  templateUrl: './macro-goals-page.component.html',
  styleUrl: './macro-goals-page.component.scss',
})
export class MacroGoalsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly macroGoalsService = inject(MacroGoalsService);
  private readonly synthesisSection = viewChild(MacroSynthesisSectionComponent);

  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = this.fb.group({
    kcal: [null as number | null, optionalMinZeroValidator],
    proteinG: [null as number | null, optionalMinZeroValidator],
    fatG: [null as number | null, optionalMinZeroValidator],
    carbsG: [null as number | null, optionalMinZeroValidator],
    fiberG: [null as number | null, optionalMinZeroValidator],
  });

  ngOnInit(): void {
    void this.loadGoals();
  }

  async onSubmit(): Promise<void> {
    this.saved.set(false);
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const raw = this.form.getRawValue();
      const payload: UpdateMacroGoalsInput = {
        kcal: normalizeGoalValue(raw.kcal),
        proteinG: normalizeGoalValue(raw.proteinG),
        fatG: normalizeGoalValue(raw.fatG),
        carbsG: normalizeGoalValue(raw.carbsG),
        fiberG: normalizeGoalValue(raw.fiberG),
      };

      await this.macroGoalsService.save(payload);
      this.saved.set(true);
      await this.synthesisSection()?.reload();
    } catch {
      this.submitError.set('Impossible d’enregistrer les objectifs.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadGoals(): Promise<void> {
    await this.macroGoalsService.load();

    const goals = this.macroGoalsService.goals();
    if (!goals) {
      return;
    }

    this.form.patchValue({
      kcal: goals.kcal ?? null,
      proteinG: goals.proteinG ?? null,
      fatG: goals.fatG ?? null,
      carbsG: goals.carbsG ?? null,
      fiberG: goals.fiberG ?? null,
    });
  }
}

function normalizeGoalValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === ('' as unknown)) {
    return null;
  }

  return value;
}
