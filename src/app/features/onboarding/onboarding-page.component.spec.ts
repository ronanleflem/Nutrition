import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { FoodLibraryImportService } from '../../core/food-library/food-library-import.service';
import { FOOD_LIBRARY_STARTER_PACK_LABEL } from '../../core/food-library/food-library-starter-pack';
import { ShellChromeService } from '../../core/layout/shell-chrome.service';
import { OnboardingPageComponent } from './onboarding-page.component';
import { OnboardingService } from './onboarding.service';

@Component({ selector: 'app-dummy-library', template: 'Bibliothèque', standalone: true })
class DummyLibraryComponent {}

@Component({ selector: 'app-dummy-recipe-form', template: 'Nouvelle recette', standalone: true })
class DummyRecipeFormComponent {}

describe('OnboardingPageComponent', () => {
  let fixture: ComponentFixture<OnboardingPageComponent>;
  let database: DatabaseService;
  let onboarding: OnboardingService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [OnboardingPageComponent],
      providers: [
        provideRouter([
          { path: 'products/library', component: DummyLibraryComponent },
          { path: 'recipes/new', component: DummyRecipeFormComponent },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    onboarding = TestBed.inject(OnboardingService);
    await database.initialize();
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
    vi.restoreAllMocks();
  });

  async function mount(): Promise<void> {
    fixture = TestBed.createComponent(OnboardingPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function waitFor(predicate: () => boolean): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      await fixture.whenStable();
      if (predicate()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Timed out waiting for condition');
  }

  function action(name: string): HTMLButtonElement | HTMLAnchorElement {
    return fixture.nativeElement.querySelector(`[data-action="${name}"]`) as
      | HTMLButtonElement
      | HTMLAnchorElement;
  }

  it('hides chrome on enter and restores it on destroy', async () => {
    const chrome = TestBed.inject(ShellChromeService);
    await mount();

    expect(chrome.hidden()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Bienvenue');
    expect(fixture.nativeElement.textContent).toContain('Étape 1 sur 3');

    fixture.destroy();
    expect(chrome.hidden()).toBe(false);
  });

  it('skips macros without writing and opens step 2 with Continuer disabled', async () => {
    const saveSpy = vi.spyOn(onboarding, 'saveMacros');
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(onboarding.currentStep()).toBe(2);
    expect((await database.getMacroGoals()).kcal).toBeUndefined();
    expect((action('continue-step-2') as HTMLButtonElement).disabled).toBe(true);
  });

  it('saves valid macros then advances to step 2', async () => {
    await mount();

    fixture.componentInstance.form.patchValue({ kcal: 1800 });
    await fixture.componentInstance.saveMacros();
    await waitFor(() => onboarding.currentStep() === 2);

    expect((await database.getMacroGoals()).kcal).toBe(1800);
    expect(onboarding.currentStep()).toBe(2);
  });

  it('shows a French error and stays on step 1 when macro save fails', async () => {
    vi.spyOn(onboarding, 'saveMacros').mockRejectedValue(new Error('fail'));
    await mount();

    await fixture.componentInstance.saveMacros();
    await waitFor(() => fixture.componentInstance.stepError() !== null);

    expect(fixture.nativeElement.textContent).toContain('Impossible d’enregistrer les objectifs.');
    expect(onboarding.currentStep()).toBe(1);
  });

  it('imports the starter pack, shows the summary, and enables Continuer', async () => {
    vi.spyOn(TestBed.inject(FoodLibraryImportService), 'importStarterPack').mockResolvedValue({
      added: 48,
      alreadyPresent: 2,
      missing: 0,
      total: 50,
    });
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(FOOD_LIBRARY_STARTER_PACK_LABEL);

    action('import-pack').click();
    await waitFor(
      () => onboarding.packSummary() !== null && !fixture.componentInstance.importingPack(),
    );

    expect(fixture.nativeElement.textContent).toContain('48 ajoutés, 2 déjà présents');
    expect((action('continue-step-2') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows a French error and stays on step 2 when pack import fails', async () => {
    vi.spyOn(TestBed.inject(FoodLibraryImportService), 'importStarterPack').mockRejectedValue(
      new Error('fail'),
    );
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();
    action('import-pack').click();
    await waitFor(() => fixture.componentInstance.stepError() !== null);

    expect(fixture.nativeElement.textContent).toContain(
      'Import du pack démarrage impossible. Réessayez.',
    );
    expect(onboarding.currentStep()).toBe(2);
    expect((action('continue-step-2') as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the library and enables Continuer on return', async () => {
    await mount();
    action('skip-macros').click();
    fixture.detectChanges();

    const libraryLink = action('browse-library') as HTMLAnchorElement;
    expect(libraryLink.getAttribute('href')).toBe('/products/library');

    libraryLink.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/products/library');
    expect(onboarding.libraryVisited()).toBe(true);

    fixture.destroy();
    await mount();

    expect(onboarding.currentStep()).toBe(2);
    expect((action('continue-step-2') as HTMLButtonElement).disabled).toBe(false);
  });

  it('creates the omelette from step 3 and finishes the wizard', async () => {
    const finishSpy = vi.spyOn(onboarding, 'createOmeletteAndFinish').mockResolvedValue();
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();
    onboarding.markLibraryVisit();
    fixture.detectChanges();
    action('continue-step-2').click();
    fixture.detectChanges();

    expect(onboarding.currentStep()).toBe(3);
    await fixture.componentInstance.createOmelette();
    fixture.detectChanges();

    expect(finishSpy).toHaveBeenCalled();
  });

  it('shows a French error on step 3 when omelette creation fails', async () => {
    vi.spyOn(onboarding, 'createOmeletteAndFinish').mockRejectedValue(
      new Error('Ingrédients introuvables.'),
    );
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();
    onboarding.markLibraryVisit();
    fixture.detectChanges();
    action('continue-step-2').click();
    fixture.detectChanges();
    await fixture.componentInstance.createOmelette();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ingrédients introuvables.');
    expect(onboarding.currentStep()).toBe(3);
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
  });

  it('opens the custom recipe form with from=onboarding', async () => {
    await mount();

    action('skip-macros').click();
    fixture.detectChanges();
    onboarding.markLibraryVisit();
    action('continue-step-2').click();
    fixture.detectChanges();
    await fixture.componentInstance.startCustomRecipe();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/recipes/new?from=onboarding');
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
  });
});
