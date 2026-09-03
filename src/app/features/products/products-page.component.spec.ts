import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Dexie from 'dexie';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import {
  CONTEXT_MENU_ACTIONS,
  CONTEXT_SHORTCUT_MESSAGES,
  LONG_PRESS_DURATION_MS,
} from '../../core/ui/context-shortcuts/context-shortcuts.models';
import { ContextShortcutsService } from '../../core/ui/context-shortcuts/context-shortcuts.service';
import { ShoppingListService } from '../shopping-list/services/shopping-list.service';
import { PantryAddSheetComponent } from '../pantry/pantry-add-sheet.component';
import { ShoppingItemSheetComponent } from '../shopping-list/components/shopping-item-sheet/shopping-item-sheet.component';
import { UseInRecipeSheetComponent } from '../../core/ui/context-shortcuts/use-in-recipe-sheet.component';
import { RecipesService } from '../recipes/services/recipes.service';
import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import {
  CIQUAL_FIXTURE_CHUNK,
  OPENNUTRITION_FIXTURE_CHUNK,
} from '../../core/food-library/food-search.fixtures';
import { FOOD_LIBRARY_MANIFEST_PATH } from '../../core/food-library/food-library-paths';
import { FOOD_SEARCH_ONLINE_DEBOUNCE_MS } from '../../core/food-library/food-search.service';
import { ProductsService } from './services/products.service';
import { ProductsPageComponent } from './products-page.component';

const MANIFEST = {
  ciqual: 'ciqual-v2025.json',
  opennutrition: 'opennutrition-v2025.1.json',
};

@Component({ standalone: true, template: 'Détail' })
class DummyProductDetailComponent {}

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let database: DatabaseService;
  let productsService: ProductsService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('search.openfoodfacts.org/search')) {
        return { ok: true, json: async () => ({ hits: [] }) } as Response;
      }

      if (url.endsWith(FOOD_LIBRARY_MANIFEST_PATH) || url.endsWith('manifest.json')) {
        return { ok: true, json: async () => MANIFEST } as Response;
      }

      if (url.includes(MANIFEST.ciqual)) {
        return { ok: true, json: async () => CIQUAL_FIXTURE_CHUNK } as Response;
      }

      if (url.includes(MANIFEST.opennutrition)) {
        return { ok: true, json: async () => OPENNUTRITION_FIXTURE_CHUNK } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });

    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [
        provideRouter([
          { path: 'products', children: [{ path: '', component: ProductsPageComponent }] },
          { path: 'products/scan', component: ProductsPageComponent },
          { path: 'products/:id', component: DummyProductDetailComponent },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    productsService = TestBed.inject(ProductsService);
    productsService.catalog.set([]);
    productsService.loading.set(false);
    fixture = TestBed.createComponent(ProductsPageComponent);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    TestBed.inject(ContextShortcutsService).reset();
    fixture.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
    TestBed.resetTestingModule();
  });

  async function waitForLoad(): Promise<void> {
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (!productsService.loading()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Products page load timed out');
  }

  it('shows empty state when catalogue is empty', async () => {
    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain('Votre catalogue est prêt');
  });

  it('lists created products after load', async () => {
    await database.createProduct({ name: 'Poulet blanc', category: 'VIANDE', priority: 'green' });

    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain('Poulet blanc');
    expect(fixture.nativeElement.textContent).toContain('Viande');
  });

  async function runSearch(query: string): Promise<void> {
    const searchInput = fixture.debugElement.query(
      By.css('.products-page__search-input'),
    ).nativeElement as HTMLInputElement;
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, FOOD_SEARCH_ONLINE_DEBOUNCE_MS + 50));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
  }

  it('filters products by search query', async () => {
    const product = await database.createProduct({ name: 'Skyr nature' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: 'Skyr catalogue',
      kcalPer100g: 50,
      proteinPer100g: 8,
      fatPer100g: 0,
      carbsPer100g: 4,
    });
    await database.setPreferredReference(product.id, reference.id);
    await database.createProduct({ name: 'Poulet blanc' });
    await productsService.loadCatalog();

    fixture.detectChanges();
    await waitForLoad();

    await runSearch('skyr');

    expect(fixture.nativeElement.textContent).toContain('Skyr nature');
    expect(fixture.nativeElement.textContent).not.toContain('Poulet blanc');
  });

  it('shows no-results message when search matches nothing', async () => {
    await database.createProduct({ name: 'Skyr nature' });

    fixture.detectChanges();
    await waitForLoad();

    await runSearch('inexistantzzzz');

    expect(fixture.nativeElement.textContent).toContain('Aucun résultat pour « inexistantzzzz ».');
  });

  it('shows scan FAB linking to scanner', async () => {
    fixture.detectChanges();
    await waitForLoad();

    const fab = fixture.debugElement.query(By.css('.products-page__fab'));
    expect(fab).toBeTruthy();
    expect(fab.nativeElement.textContent).toContain('Scan');
  });

  it('displays score and macros when preferred reference exists', async () => {
    const product = await database.createProduct({ name: 'Skyr nature', category: 'LAITIER' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: 'Skyr Auchan',
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });
    await database.setPreferredReference(product.id, reference.id);
    await productsService.loadCatalog();

    fixture.detectChanges();
    await waitForLoad();

    expect(fixture.nativeElement.textContent).toContain(String(reference.nutritionalScore));
    expect(fixture.nativeElement.textContent).toContain('57 kcal');
    expect(fixture.nativeElement.textContent).toContain('Auchan');
  });

  async function seedCatalogProduct(name: string): Promise<{ id: string; name: string }> {
    const product = await database.createProduct({ name, category: 'LAITIER' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'auchan',
      label: `${name} ref`,
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });
    await database.setPreferredReference(product.id, reference.id);
    await productsService.loadCatalog();
    return { id: product.id, name };
  }

  async function openProductMenu(): Promise<void> {
    await TestBed.inject(Router).navigateByUrl('/products');
    fixture.detectChanges();
    await waitForLoad();
    const menu = fixture.nativeElement.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();
  }

  function clickAction(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('.sheet__list-button')].find((node) =>
      (node.textContent ?? '').includes(label),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeTruthy();
    button!.click();
    fixture.detectChanges();
  }

  it('opens the three product shortcut sheets without leaving /products', async () => {
    await seedCatalogProduct('Skyr nature');
    await openProductMenu();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('adds a pantry item from a product shortcut and stays on /products', async () => {
    const product = await seedCatalogProduct('Skyr nature');
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.pantry);

    expect(fixture.nativeElement.textContent).toContain('Skyr nature');
    expect(fixture.nativeElement.textContent).not.toContain('Choisir un produit');

    const sheet = fixture.debugElement.query(By.directive(PantryAddSheetComponent))
      .componentInstance as PantryAddSheetComponent;
    sheet.form.patchValue({ quantityG: 80 });
    await sheet.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    const items = await database.listPantryItemsWithProducts();
    expect(items).toHaveLength(1);
    expect(items[0]?.productId).toBe(product.id);
    expect(items[0]?.quantityG).toBe(80);
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.productAdded);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('keeps the pantry sheet open with a French error when addItem fails', async () => {
    await seedCatalogProduct('Skyr nature');
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.pantry);

    const sheet = fixture.debugElement.query(By.directive(PantryAddSheetComponent))
      .componentInstance as PantryAddSheetComponent;
    vi.spyOn(sheet['pantry'], 'addItem').mockRejectedValue(new Error('Stock indisponible.'));
    await sheet.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Stock indisponible.');
    expect(fixture.debugElement.query(By.directive(PantryAddSheetComponent))).toBeTruthy();
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('creates a real recipe from « Nouvelle recette » and stays on /products', async () => {
    const product = await seedCatalogProduct('Skyr nature');
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.useInRecipe);

    const sheet = fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))
      .componentInstance as UseInRecipeSheetComponent;
    sheet.form.patchValue({ quantityG: 90 });
    await sheet.createNewRecipe();
    fixture.detectChanges();
    await fixture.whenStable();

    const recipes = await database.listRecipes();
    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.recipe.title).toBe('Skyr nature');
    expect(recipes[0]?.recipe.defaultPortions).toBe(1);
    const detail = await database.getRecipeDetail(recipes[0]!.recipe.id);
    expect(detail?.variants[0]?.name).toBe('Base');
    expect(detail?.variants[0]?.ingredients[0]?.productId).toBe(product.id);
    expect(detail?.variants[0]?.ingredients[0]?.quantityG).toBe(90);
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.recipeCreated);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('appends the product to an existing recipe default variant', async () => {
    const product = await seedCatalogProduct('Skyr nature');
    const other = await database.createProduct({ name: 'Avoine' });
    const otherRef = await database.createProductReference({
      productId: other.id,
      store: 'other',
      label: 'Avoine ref',
      kcalPer100g: 370,
      proteinPer100g: 13,
      fatPer100g: 7,
      carbsPer100g: 60,
    });
    await database.setPreferredReference(other.id, otherRef.id);
    const existing = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Porridge', steps: ['Mélanger'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: other.id, quantityG: 50 }],
    });

    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.useInRecipe);

    const sheet = fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))
      .componentInstance as UseInRecipeSheetComponent;
    sheet.form.patchValue({ quantityG: 40 });
    await TestBed.inject(RecipesService).loadRecipes();
    fixture.detectChanges();
    sheet.openPicker();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const pick = fixture.nativeElement.querySelector('.recipe-picker__item') as HTMLButtonElement;
    expect(pick).toBeTruthy();
    pick.click();
    for (let attempt = 0; attempt < 50; attempt++) {
      await fixture.whenStable();
      fixture.detectChanges();
      if (fixture.nativeElement.textContent.includes(CONTEXT_SHORTCUT_MESSAGES.ingredientAdded)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const detail = await database.getRecipeDetail(existing.recipe.id);
    const added = detail?.variants[0]?.ingredients.find((ingredient) => ingredient.productId === product.id);
    expect(added?.quantityG).toBe(40);
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.ingredientAdded);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('shows the existing preferred-reference error when creating a recipe from a product without one', async () => {
    await database.createProduct({ name: 'Sans ref' });
    await productsService.loadCatalog();
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.useInRecipe);

    const sheet = fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))
      .componentInstance as UseInRecipeSheetComponent;
    await sheet.createNewRecipe();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toMatch(/référence préférée/i);
    expect(fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))).toBeTruthy();
    expect(await database.listRecipes()).toEqual([]);
  });

  it('adds a manual shopping item from a product shortcut without calling refresh()', async () => {
    const product = await seedCatalogProduct('Skyr nature');
    const refresh = vi.spyOn(TestBed.inject(ShoppingListService), 'refresh');
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.shopping);

    const sheet = fixture.debugElement.query(By.directive(ShoppingItemSheetComponent))
      .componentInstance as ShoppingItemSheetComponent;
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    sheet.form.patchValue({ quantityG: 250 });
    await sheet.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    const items = await database.listShoppingListItemsWithProducts();
    expect(items).toHaveLength(1);
    expect(items[0]?.productId).toBe(product.id);
    expect(items[0]?.quantityG).toBe(250);
    expect(items[0]?.source).toBe('manual');
    expect(fixture.nativeElement.textContent).toContain(CONTEXT_SHORTCUT_MESSAGES.itemAdded);
    expect(refresh).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('keeps the shopping sheet open with a French error and does not call refresh()', async () => {
    await seedCatalogProduct('Skyr nature');
    const refresh = vi.spyOn(TestBed.inject(ShoppingListService), 'refresh');
    await openProductMenu();
    clickAction(CONTEXT_MENU_ACTIONS.shopping);

    const sheet = fixture.debugElement.query(By.directive(ShoppingItemSheetComponent))
      .componentInstance as ShoppingItemSheetComponent;
    vi.spyOn(sheet['shopping'], 'addManualItem').mockRejectedValue(new Error('Liste indisponible.'));
    await sheet.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Liste indisponible.');
    expect(fixture.debugElement.query(By.directive(ShoppingItemSheetComponent))).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('closes the menu on backdrop or × and keeps the URL', async () => {
    await seedCatalogProduct('Skyr nature');
    await openProductMenu();

    (fixture.nativeElement.querySelector('[data-backdrop="true"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/products');

    await openProductMenu();
    (fixture.nativeElement.querySelector('.sheet__close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('shows the preferred-reference error when appending to an existing recipe', async () => {
    await database.createProduct({ name: 'Sans ref' });
    const other = await seedCatalogProduct('Avoine');
    const existing = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Porridge', steps: ['Mélanger'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: other.id, quantityG: 50 }],
    });
    await productsService.loadCatalog();
    await TestBed.inject(Router).navigateByUrl('/products');
    fixture.detectChanges();
    await waitForLoad();
    const sansRefCard = [...fixture.nativeElement.querySelectorAll('.product-card')].find((card) =>
      (card.textContent ?? '').includes('Sans ref'),
    ) as HTMLElement;
    (sansRefCard.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    clickAction(CONTEXT_MENU_ACTIONS.useInRecipe);

    const sheet = fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))
      .componentInstance as UseInRecipeSheetComponent;
    await sheet.onRecipeSelected(existing.recipe.id);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toMatch(/référence préférée/i);
    expect(fixture.debugElement.query(By.directive(UseInRecipeSheetComponent))).toBeTruthy();
  });

  it('opens the three actions after a long-press on the catalog card', async () => {
    await seedCatalogProduct('Skyr nature');
    await TestBed.inject(Router).navigateByUrl('/products');
    fixture.detectChanges();
    await waitForLoad();

    const card = fixture.nativeElement.querySelector('.product-card') as HTMLElement;
    card.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 8, clientY: 8 }),
    );
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS + 30));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('keeps the title link to product detail', async () => {
    const product = await seedCatalogProduct('Skyr nature');
    await TestBed.inject(Router).navigateByUrl('/products');
    fixture.detectChanges();
    await waitForLoad();

    const link = fixture.nativeElement.querySelector('.product-card__link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/products/${product.id}`);
  });
});
