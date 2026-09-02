import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FOOD_LIBRARY_STARTER_PACK_LABEL } from '../../core/food-library/food-library-starter-pack';
import type { StarterPackImportSummary } from '../../core/food-library/food-library-import.service';
import { ShellChromeService } from '../../core/layout/shell-chrome.service';
import type { UpdateMacroGoalsInput } from '../../core/models/macro-goals';
import { OnboardingService } from './onboarding.service';

function optionalMinZeroValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value) >= 0 ? null : { min: true };
}

function normalizeGoalValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === ('' as unknown)) {
    return null;
  }

  return value;
}

@Component({
  selector: 'app-onboarding-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './onboarding-page.component.html',
  styleUrl: './onboarding-page.component.scss',
})
export class OnboardingPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly shellChrome = inject(ShellChromeService);
  readonly onboarding = inject(OnboardingService);

  readonly starterPackLabel = FOOD_LIBRARY_STARTER_PACK_LABEL;
  readonly savingMacros = signal(false);
  readonly importingPack = signal(false);
  readonly creatingRecipe = signal(false);
  readonly stepError = signal<string | null>(null);

  readonly form = this.fb.group({
    kcal: [null as number | null, optionalMinZeroValidator],
    proteinG: [null as number | null, optionalMinZeroValidator],
    fatG: [null as number | null, optionalMinZeroValidator],
    carbsG: [null as number | null, optionalMinZeroValidator],
    fiberG: [null as number | null, optionalMinZeroValidator],
  });

  ngOnInit(): void {
    this.shellChrome.setHidden(true);
    this.onboarding.enterWizard();
  }

  ngOnDestroy(): void {
    this.shellChrome.setHidden(false);
  }

  skipMacros(): void {
    this.stepError.set(null);
    this.onboarding.skipMacros();
  }

  async saveMacros(): Promise<void> {
    this.stepError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.savingMacros.set(true);

    try {
      const raw = this.form.getRawValue();
      const payload: UpdateMacroGoalsInput = {
        kcal: normalizeGoalValue(raw.kcal),
        proteinG: normalizeGoalValue(raw.proteinG),
        fatG: normalizeGoalValue(raw.fatG),
        carbsG: normalizeGoalValue(raw.carbsG),
        fiberG: normalizeGoalValue(raw.fiberG),
      };
      await this.onboarding.saveMacros(payload);
    } catch {
      this.stepError.set('Impossible d’enregistrer les objectifs.');
    } finally {
      this.savingMacros.set(false);
    }
  }

  async importStarterPack(): Promise<void> {
    this.stepError.set(null);
    this.importingPack.set(true);

    try {
      await this.onboarding.importStarterPack();
    } catch {
      this.stepError.set('Import du pack démarrage impossible. Réessayez.');
    } finally {
      this.importingPack.set(false);
    }
  }

  onBrowseLibrary(): void {
    this.onboarding.markLibraryVisit();
  }

  goToStep3(): void {
    this.stepError.set(null);
    this.onboarding.goToStep3();
  }

  startCustomRecipe(): Promise<boolean> {
    return this.onboarding.startCustomRecipe();
  }

  async createOmelette(): Promise<void> {
    this.stepError.set(null);
    this.creatingRecipe.set(true);

    try {
      await this.onboarding.createOmeletteAndFinish();
    } catch (error) {
      this.stepError.set(
        error instanceof Error ? error.message : 'Impossible de créer la recette. Réessayez.',
      );
    } finally {
      this.creatingRecipe.set(false);
    }
  }

  formatPackSummary(summary: StarterPackImportSummary): string {
    return `${summary.added} ajoutés, ${summary.alreadyPresent} déjà présents`;
  }
}
