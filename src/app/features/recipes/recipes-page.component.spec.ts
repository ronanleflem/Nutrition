import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { LONG_PRESS_DURATION_MS } from '../../core/ui/context-shortcuts/context-shortcuts.models';
import {
  CONTEXT_MENU_ACTIONS,
  CONTEXT_SHORTCUT_MESSAGES,
} from '../../core/ui/context-shortcuts/context-shortcuts.models';
import { PantryAddSheetComponent } from '../pantry/pantry-add-sheet.component';
import { ShoppingListService } from '../shopping-list/services/shopping-list.service';
import { ContextShortcutsService } from '../../core/ui/context-shortcuts/context-shortcuts.service';
import { RecipesPageComponent } from './recipes-page.component';

@Component({ standalone: true, template: 'Détail recette' })
class DummyRecipeDetailComponent {}

describe('RecipesPageComponent', () => {
  let fixture: ComponentFixture<RecipesPageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [RecipesPageComponent],
      providers: [
        provideRouter([
          { path: 'recipes', component: RecipesPageComponent },
          { path: 'recipes/:id', component: DummyRecipeDetailComponent },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
    TestBed.resetTestingModule();
  });

  async function seedProduct(name: string): Promise<string> {
    const product = await database.createProduct({ name });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: `${name} ref`,
      kcalPer100g: 100,
      proteinPer100g: 10,
      fatPer100g: 4,
      carbsPer100g: 6,
    });
    await database.setPreferredReference(product.id, reference.id);
    return product.id;
  }

  async function mount(): Promise<void> {
    await TestBed.inject(Router).navigateByUrl('/recipes');
    fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();
    for (let attempt = 0; attempt < 50; attempt++) {
      await fixture.whenStable();
      fixture.detectChanges();
      if (!fixture.componentInstance.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Recipes page load timed out');
  }

  function openMenu(): void {
    const menu = fixture.nativeElement.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();
  }

  async function clickAction(label: string): Promise<void> {
    const button = [...fixture.nativeElement.querySelectorAll('.sheet__list-button')].find((node) =>
      (node.textContent ?? '').includes(label),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeTruthy();
    button!.click();
    await waitForMenuToAdvance();
  }

  async function waitForMenuToAdvance(): Promise<void> {
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

  it('shows empty state when no recipes', async () => {
    await mount();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Ajoutez votre première recette');
  });

  it('opens pantry and shopping actions without « Utiliser dans une recette »', async () => {
    const productId = await seedProduct('Œuf');
    await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 120 }],
    });
    await mount();
    openMenu();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
    expect(text).not.toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
    expect(TestBed.inject(Router).url).toBe('/recipes');
  });

  it('opens a prefilled pantry sheet when the recipe has one default ingredient', async () => {
    const productId = await seedProduct('Œuf');
    await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 120 }],
    });
    await mount();
    openMenu();
    await clickAction(CONTEXT_MENU_ACTIONS.pantry);

    const sheet = fixture.debugElement.query(By.directive(PantryAddSheetComponent))
      .componentInstance as PantryAddSheetComponent;
    expect(sheet.prefillProductId()).toBe(productId);
    expect(sheet.prefillQuantityG()).toBe(120);
    expect(fixture.nativeElement.textContent).toContain('Œuf');
    expect(TestBed.inject(Router).url).toBe('/recipes');
  });

  it('asks to pick an ingredient then opens the pantry sheet', async () => {
    const eggId = await seedProduct('Œuf');
    const butterId = await seedProduct('Beurre');
    await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [
        { productId: eggId, quantityG: 120 },
        { productId: butterId, quantityG: 10 },
      ],
    });
    await mount();
    openMenu();
    await clickAction(CONTEXT_MENU_ACTIONS.pantry);

    expect(fixture.nativeElement.textContent).toContain('Choisir un ingrédient');
    const pick = [...fixture.nativeElement.querySelectorAll('button')].find((node) =>
      (node.textContent ?? '').includes('Beurre'),
    ) as HTMLButtonElement;
    pick.click();
    fixture.detectChanges();

    const sheet = fixture.debugElement.query(By.directive(PantryAddSheetComponent))
      .componentInstance as PantryAddSheetComponent;
    expect(sheet.prefillProductId()).toBe(butterId);
  });

  it('adds every default-variant ingredient to the manual list without refresh()', async () => {
    const eggId = await seedProduct('Œuf');
    const butterId = await seedProduct('Beurre');
    await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [
        { productId: eggId, quantityG: 120 },
        { productId: butterId, quantityG: 10 },
      ],
    });
    const refresh = vi.spyOn(TestBed.inject(ShoppingListService), 'refresh');
    await mount();
    openMenu();
    await clickAction(CONTEXT_MENU_ACTIONS.shopping);

    const items = await database.listShoppingListItemsWithProducts();
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.productId === eggId)?.quantityG).toBe(120);
    expect(items.find((item) => item.productId === butterId)?.quantityG).toBe(10);
    expect(refresh).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.itemsAdded);
    expect(TestBed.inject(Router).url).toBe('/recipes');
  });

  it('shows a French empty message when the default variant has no ingredients', async () => {
    const productId = await seedProduct('Œuf');
    await database.createRecipeWithFirstVariant({
      recipe: { title: 'Vide', steps: ['Rien'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 10 }],
    });
    const db = new NutritionDatabase();
    await db.open();
    await db.recipeIngredients.clear();
    await db.close();

    await mount();
    openMenu();
    await clickAction(CONTEXT_MENU_ACTIONS.shopping);

    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.emptyVariant);
    expect(TestBed.inject(Router).url).toBe('/recipes');
  });

  it('opens the menu on long-press and still exposes the detail link for a tap', async () => {
    const productId = await seedProduct('Œuf');
    const created = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Omelette', steps: ['Battre'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId, quantityG: 120 }],
    });
    await mount();

    const link = fixture.nativeElement.querySelector('.recipes-page__card-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/recipes/${created.recipe.id}`);

    const card = fixture.nativeElement.querySelector('.recipes-page__card') as HTMLElement;
    card.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 8, clientY: 8 }),
    );
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS + 40));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_MENU_ACTIONS.pantry);

    (fixture.nativeElement.querySelector('.sheet__close') as HTMLButtonElement).click();
    fixture.detectChanges();

    card.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 8, clientY: 8 }),
    );
    card.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 40, clientY: 8 }));
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});
