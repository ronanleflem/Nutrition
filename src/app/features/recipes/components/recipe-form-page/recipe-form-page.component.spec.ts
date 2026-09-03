import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../../core/database/nutrition-database.testing';
import { RecipeFormPageComponent } from './recipe-form-page.component';

@Component({ template: 'Accueil', standalone: true })
class DummyHomeComponent {}

@Component({ template: 'Recettes', standalone: true })
class DummyRecipesComponent {}

@Component({ template: 'Photo prompt', standalone: true })
class DummyPhotoPromptComponent {}

describe('RecipeFormPageComponent onboarding return', () => {
  let fixture: ComponentFixture<RecipeFormPageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);
  });

  afterEach(async () => {
    fixture?.destroy();
    await database?.closeForTests();
    await deleteNutritionDatabase();
    TestBed.resetTestingModule();
  });

  async function setup(fromOnboarding: boolean): Promise<string> {
    await TestBed.configureTestingModule({
      imports: [RecipeFormPageComponent],
      providers: [
        provideRouter([
          { path: 'home', component: DummyHomeComponent },
          { path: 'recipes', component: DummyRecipesComponent },
          { path: 'recipes/:id/photo-prompt', component: DummyPhotoPromptComponent },
          { path: 'onboarding', component: DummyHomeComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(fromOnboarding ? { from: 'onboarding' } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();

    const product = await database.createProduct({ name: 'Œuf' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: 'Œuf ref',
      kcalPer100g: 143,
      proteinPer100g: 13,
      fatPer100g: 10,
      carbsPer100g: 1,
    });
    await database.setPreferredReference(product.id, reference.id);

    fixture = TestBed.createComponent(RecipeFormPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return product.id;
  }

  async function submitRecipe(productId: string): Promise<void> {
    const page = fixture.componentInstance;
    page.form.patchValue({
      title: 'Soupe',
      variantName: 'Base',
      defaultPortions: 2,
    });
    page.steps.at(0).setValue('Mixer');
    page.ingredients.at(0).patchValue({ productId, quantityG: 100 });
    await page.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('opens the photo prompt after a successful create from onboarding without completing onboarding yet', async () => {
    const productId = await setup(true);
    await submitRecipe(productId);

    expect((await database.listRecipes())[0].recipe.title).toBe('Soupe');
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
    expect(TestBed.inject(Router).url).toContain('/photo-prompt');
    expect(TestBed.inject(Router).url).toContain('from=onboarding');
  });

  it('opens the photo prompt when creating a recipe outside onboarding', async () => {
    const productId = await setup(false);
    await submitRecipe(productId);

    expect((await database.listRecipes())[0].recipe.title).toBe('Soupe');
    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
    expect(TestBed.inject(Router).url).toContain('/photo-prompt');
  });

  it('navigates back to the photo prompt if onboarding submit is triggered twice', async () => {
    const productId = await setup(true);
    await submitRecipe(productId);
    await submitRecipe(productId);

    expect(await database.listRecipes()).toHaveLength(1);
    expect(TestBed.inject(Router).url).toContain('/photo-prompt');
  });

  it('leaves the flag unchanged when the onboarding form is abandoned', async () => {
    await setup(true);

    expect((await database.getAppSettings()).onboardingCompleted).toBeUndefined();
    expect(await database.listRecipes()).toEqual([]);
    expect(
      (fixture.nativeElement.querySelector('.recipe-form__button--secondary') as HTMLAnchorElement)
        .getAttribute('href'),
    ).toBe('/onboarding');
  });
});
