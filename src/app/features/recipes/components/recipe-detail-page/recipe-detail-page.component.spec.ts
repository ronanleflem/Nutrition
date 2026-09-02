import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import Dexie from 'dexie';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../../../core/database/database.service';
import { NUTRITION_DB_NAME } from '../../../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../../../core/database/nutrition-database.testing';
import {
  CONTEXT_MENU_ACTIONS,
  CONTEXT_SHORTCUT_MESSAGES,
} from '../../../../core/ui/context-shortcuts/context-shortcuts.models';
import { ContextShortcutsService } from '../../../../core/ui/context-shortcuts/context-shortcuts.service';
import { PantryAddSheetComponent } from '../../../pantry/pantry-add-sheet.component';
import { ShoppingListService } from '../../../shopping-list/services/shopping-list.service';
import { RecipeDetailPageComponent } from './recipe-detail-page.component';

@Component({ standalone: true, template: 'Liste' })
class DummyRecipesComponent {}

describe('RecipeDetailPageComponent shortcuts', () => {
  let fixture: ComponentFixture<RecipeDetailPageComponent>;
  let database: DatabaseService;
  let recipeId: string;
  let productId: string;
  const params = new BehaviorSubject(convertToParamMap({ id: '' }));

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);
    params.next(convertToParamMap({ id: '' }));
  });

  afterEach(async () => {
    fixture?.destroy();
    await database?.closeForTests();
    await deleteNutritionDatabase();
    TestBed.resetTestingModule();
  });

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RecipeDetailPageComponent],
      providers: [
        provideRouter([
          { path: 'recipes', component: DummyRecipesComponent },
          { path: 'recipes/:id', component: RecipeDetailPageComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: params },
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
    productId = product.id;

    const created = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 120 }],
    });
    recipeId = created.recipe.id;
    params.next(convertToParamMap({ id: recipeId }));

    await TestBed.inject(Router).navigateByUrl(`/recipes/${recipeId}`);
    fixture = TestBed.createComponent(RecipeDetailPageComponent);
    fixture.detectChanges();
    for (let attempt = 0; attempt < 50; attempt++) {
      await fixture.whenStable();
      fixture.detectChanges();
      if (!fixture.componentInstance.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Recipe detail load timed out');
  }

  it('opens recipe actions from the fiche ⋮ without leaving the route', async () => {
    await setup();

    const menu = fixture.nativeElement.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
    expect(text).not.toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
    expect(TestBed.inject(Router).url).toBe(`/recipes/${recipeId}`);
  });

  async function choose(label: string): Promise<void> {
    (fixture.nativeElement.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const button = [...fixture.nativeElement.querySelectorAll('[role="menuitem"]')].find((node) =>
      (node.textContent ?? '').includes(label),
    ) as HTMLButtonElement;
    button.click();
    const shortcuts = TestBed.inject(ContextShortcutsService);
    for (let attempt = 0; attempt < 50; attempt++) {
      await fixture.whenStable();
      fixture.detectChanges();
      if (shortcuts.sheet()?.name !== 'menu') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Menu action did not complete: ${JSON.stringify(shortcuts.sheet())}`);
  }

  it('opens a prefilled pantry sheet from the fiche', async () => {
    await setup();
    await choose(CONTEXT_MENU_ACTIONS.pantry);

    const sheet = fixture.debugElement.query(By.directive(PantryAddSheetComponent))
      .componentInstance as PantryAddSheetComponent;
    expect(sheet.prefillProductId()).toBe(productId);
    expect(TestBed.inject(Router).url).toBe(`/recipes/${recipeId}`);
  });

  it('adds default-variant ingredients to the manual list from the fiche', async () => {
    await setup();
    const refresh = vi.spyOn(TestBed.inject(ShoppingListService), 'refresh');
    await choose(CONTEXT_MENU_ACTIONS.shopping);

    const items = await database.listShoppingListItemsWithProducts();
    expect(items).toHaveLength(1);
    expect(items[0]?.productId).toBe(productId);
    expect(refresh).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.itemAdded);
    expect(TestBed.inject(Router).url).toBe(`/recipes/${recipeId}`);
  });
});
