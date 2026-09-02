import 'fake-indexeddb/auto';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../database/database.service';
import { NUTRITION_DB_NAME } from '../../database/nutrition-database';
import { deleteNutritionDatabase } from '../../database/nutrition-database.testing';
import { RecipesService } from '../../../features/recipes/services/recipes.service';
import { UseInRecipeSheetComponent } from './use-in-recipe-sheet.component';

describe('UseInRecipeSheetComponent', () => {
  let fixture: ComponentFixture<UseInRecipeSheetComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [UseInRecipeSheetComponent],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
    vi.restoreAllMocks();
  });

  function mount(productId: string): void {
    fixture = TestBed.createComponent(UseInRecipeSheetComponent);
    fixture.componentRef.setInput('productId', productId);
    fixture.componentRef.setInput('productName', 'Skyr');
    fixture.detectChanges();
  }

  it('surfaces a French error when recipes fail to load', async () => {
    vi.spyOn(RecipesService.prototype, 'loadRecipes').mockRejectedValue(new Error('Dexie'));
    mount('p1');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les recettes.');
  });

  it('ignores a second recipe pick while the first append is in flight', async () => {
    const product = await database.createProduct({ name: 'Skyr' });
    const reference = await database.createProductReference({
      productId: product.id,
      store: 'other',
      label: 'Skyr ref',
      kcalPer100g: 60,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });
    await database.setPreferredReference(product.id, reference.id);
    const first = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Bowl', steps: ['Mélanger'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: product.id, quantityG: 50 }],
    });
    const second = await database.createRecipeWithFirstVariant({
      recipe: { title: 'Toast', steps: ['Griller'], defaultPortions: 1 },
      variantName: 'Base',
      ingredients: [{ productId: product.id, quantityG: 20 }],
    });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const append = vi
      .spyOn(RecipesService.prototype, 'appendIngredientToDefaultVariant')
      .mockImplementation(() => gate.then(() => ({ id: 'ing' }) as never));

    mount(product.id);
    await fixture.whenStable();

    const firstPick = fixture.componentInstance.onRecipeSelected(first.recipe.id);
    const secondPick = fixture.componentInstance.onRecipeSelected(second.recipe.id);
    release();
    await Promise.all([firstPick, secondPick]);

    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith(first.recipe.id, {
      productId: product.id,
      quantityG: 100,
    });
  });
});
