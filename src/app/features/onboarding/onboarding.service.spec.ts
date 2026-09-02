import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { FoodLibraryImportService } from '../../core/food-library/food-library-import.service';
import { MacroGoalsService } from '../macro-goals/services/macro-goals.service';
import {
  OMELETTE_CIQUAL_IDS,
  OMELETTE_INGREDIENTS,
  OMELETTE_TITLE,
  OMELETTE_VARIANT_NAME,
} from './onboarding.constants';
import { OMELETTE_INGREDIENTS_MISSING_ERROR, OnboardingService } from './onboarding.service';

@Component({ template: 'Accueil', standalone: true })
class DummyHomeComponent {}

@Component({ template: 'Nouvelle recette', standalone: true })
class DummyRecipeFormComponent {}

describe('OnboardingService', () => {
  let service: OnboardingService;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: DummyHomeComponent },
          { path: 'recipes/new', component: DummyRecipeFormComponent },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
    service = TestBed.inject(OnboardingService);
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
    vi.restoreAllMocks();
  });

  async function seedProduct(sourceId: string, name: string): Promise<string> {
    const product = await database.createProduct({
      name,
      sourceProvider: 'ciqual',
      sourceId,
    });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: `${name} ref`,
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 12,
    });
    await database.setPreferredReference(product.id, reference.id);
    return product.id;
  }

  it('skips macros without writing goals and advances to step 2', async () => {
    const saveSpy = vi.spyOn(TestBed.inject(MacroGoalsService), 'save');

    service.skipMacros();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(service.currentStep()).toBe(2);
    expect((await database.getMacroGoals()).kcal).toBeUndefined();
  });

  it('saves macros then advances to step 2', async () => {
    await service.saveMacros({ kcal: 2000, proteinG: 80, fatG: 70, carbsG: 220, fiberG: 25 });

    const goals = await database.getMacroGoals();
    expect(goals.kcal).toBe(2000);
    expect(goals.proteinG).toBe(80);
    expect(service.currentStep()).toBe(2);
  });

  it('enables step 2 after a pack import and keeps continuer ready on an idempotent rerun', async () => {
    const importService = TestBed.inject(FoodLibraryImportService);
    vi.spyOn(importService, 'importStarterPack')
      .mockResolvedValueOnce({ added: 50, alreadyPresent: 0, missing: 0, total: 50 })
      .mockResolvedValueOnce({ added: 0, alreadyPresent: 50, missing: 0, total: 50 });

    expect(service.step2Ready()).toBe(false);

    const first = await service.importStarterPack();
    expect(first.added).toBe(50);
    expect(service.step2Ready()).toBe(true);
    expect(importService.importStarterPack).toHaveBeenCalledWith();

    const second = await service.importStarterPack();
    expect(second.added).toBe(0);
    expect(second.alreadyPresent).toBe(50);
    expect(service.step2Ready()).toBe(true);
  });

  it('resumes step 2 after a library visit and starts at step 1 on relaunch', () => {
    service.markLibraryVisit();
    service.enterWizard();

    expect(service.currentStep()).toBe(2);
    expect(service.step2Ready()).toBe(true);

    service.resetForRelaunch();
    service.enterWizard();

    expect(service.currentStep()).toBe(1);
    expect(service.step2Ready()).toBe(false);
  });

  it('creates the Omelette recipe, sets the flag, and opens Accueil', async () => {
    await seedProduct('ciqual-22000', 'Œuf');
    await seedProduct('ciqual-16400', 'Beurre');
    await seedProduct('ciqual-11058', 'Sel');

    await service.createOmeletteAndFinish();

    const recipes = await database.listRecipes();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].recipe.title).toBe(OMELETTE_TITLE);

    const detail = await database.getRecipeDetail(recipes[0].recipe.id);
    expect(detail?.variants[0].name).toBe(OMELETTE_VARIANT_NAME);
    expect(detail?.variants[0].ingredients).toHaveLength(3);
    expect(
      detail?.variants[0].ingredients.map((item) => item.quantityG).sort((a, b) => a - b),
    ).toEqual(OMELETTE_INGREDIENTS.map((item) => item.quantityG).sort((a, b) => a - b));

    expect((await database.getAppSettings()).onboardingCompleted).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/home');
  });

  it('imports the three Ciqual omelette ids when they are missing from the catalog', async () => {
    const importService = TestBed.inject(FoodLibraryImportService);
    const importSpy = vi.spyOn(importService, 'importStarterPack').mockImplementation(async () => {
      await seedProduct('ciqual-22000', 'Œuf');
      await seedProduct('ciqual-16400', 'Beurre');
      await seedProduct('ciqual-11058', 'Sel');
      return { added: 3, alreadyPresent: 0, missing: 0, total: 3 };
    });

    await service.createOmeletteAndFinish();

    expect(importSpy).toHaveBeenCalledWith(OMELETTE_CIQUAL_IDS);
    expect((await database.listRecipes())[0].recipe.title).toBe(OMELETTE_TITLE);
    expect((await database.getAppSettings()).onboardingCompleted).toBe(true);
  });

  it('throws a French error when omelette ingredients cannot be resolved', async () => {
    vi.spyOn(TestBed.inject(FoodLibraryImportService), 'importStarterPack').mockResolvedValue({
      added: 0,
      alreadyPresent: 0,
      missing: 3,
      total: 3,
    });

    await expect(service.createOmeletteAndFinish()).rejects.toThrow(OMELETTE_INGREDIENTS_MISSING_ERROR);
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
  });

  it('navigates to the custom recipe form with the onboarding query', async () => {
    await service.startCustomRecipe();

    expect(TestBed.inject(Router).url).toBe('/recipes/new?from=onboarding');
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
  });

  it('resumes step 3 after abandoning the custom recipe form', async () => {
    service.markLibraryVisit();
    service.goToStep3();
    await service.startCustomRecipe();
    service.enterWizard();

    expect(service.currentStep()).toBe(3);
  });

  it('does not enable step 2 when the pack import finds nothing', async () => {
    const importService = TestBed.inject(FoodLibraryImportService);
    vi.spyOn(importService, 'importStarterPack').mockResolvedValue({
      added: 0,
      alreadyPresent: 0,
      missing: 50,
      total: 50,
    });

    await service.importStarterPack();
    expect(service.step2Ready()).toBe(false);
  });

  it('completes onboarding after a custom recipe and opens Accueil', async () => {
    await service.completeAfterCustomRecipe();

    expect((await database.getAppSettings()).onboardingCompleted).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/home');
  });
});
