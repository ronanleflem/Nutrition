import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { DatabaseService } from '../../core/database/database.service';
import { PantryPageComponent } from './pantry-page.component';
import { PantryService } from './pantry.service';

@Component({
  template: '<app-pantry-page />',
  imports: [PantryPageComponent],
})
class PantryHostComponent {}

describe('PantryPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<PantryHostComponent> | null = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PantryHostComponent],
    });
  });

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);
  });

  afterEach(async () => {
    await TestBed.inject(PantryService).refresh().catch(() => undefined);
    if (fixture) {
      fixture.destroy();
      fixture = null;
    }
    await TestBed.inject(DatabaseService).closeForTests();
    await deleteNutritionDatabase();
  });

  it('shows empty state when pantry has no items', async () => {
    fixture = TestBed.createComponent(PantryHostComponent);
    const pantry = TestBed.inject(PantryService);
    fixture.detectChanges();
    await pantry.refresh();
    fixture.detectChanges();

    expect(pantry.items()).toHaveLength(0);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Votre garde-manger est vide');
    expect(text).toContain('Ajouter un produit');
  });

  it('lists pantry items after refresh', async () => {
    const db = TestBed.inject(DatabaseService);
    await db.initialize();
    const product = await db.createProduct('Lait');
    await db.addPantryItem({ productId: product.id, quantityG: 500 });

    const pantry = TestBed.inject(PantryService);
    await pantry.refresh();

    fixture = TestBed.createComponent(PantryHostComponent);
    fixture.detectChanges();

    expect(pantry.items()).toHaveLength(1);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Lait');
    expect(text).toContain('500 g');
  });
});
