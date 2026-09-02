import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import Dexie from 'dexie';

import { NUTRITION_DB_NAME } from '../../core/database/nutrition-database';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { DatabaseService } from '../../core/database/database.service';
import { PantryPageComponent } from './pantry-page.component';
import { PantryService } from './pantry.service';

@Component({
  selector: 'app-pantry-host',
  template: '<app-pantry-page />',
  imports: [PantryPageComponent],
})
class PantryHostComponent {}

@Component({
  selector: 'app-pantry-routed-host',
  template: '<router-outlet />',
  imports: [RouterOutlet],
})
class PantryRoutedHostComponent {}

describe('PantryPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<
    PantryHostComponent | PantryRoutedHostComponent
  > | null = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PantryHostComponent, PantryRoutedHostComponent],
      providers: [provideRouter([{ path: 'pantry', component: PantryPageComponent }])],
    });
  });

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);
  });

  afterEach(async () => {
    TestBed.inject(PantryService).setFilterMode('all');
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
    expect(text).toContain('Votre garde-manger vous attend');
    expect(text).toContain('Ajouter un produit');
  });

  it('lists pantry items after refresh', async () => {
    const db = TestBed.inject(DatabaseService);
    await db.initialize();
    const product = await db.createProduct({ name: 'Lait' });
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

  it('shows expiry warning badge for near DLC', async () => {
    const db = TestBed.inject(DatabaseService);
    await db.initialize();
    const near = await db.createProduct({ name: 'Yaourt' });
    const far = await db.createProduct({ name: 'Riz' });

    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const later = new Date();
    later.setDate(later.getDate() + 10);
    const format = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;

    await db.addPantryItem({
      productId: near.id,
      quantityG: 200,
      expiryDate: format(soon),
    });
    await db.addPantryItem({
      productId: far.id,
      quantityG: 500,
      expiryDate: format(later),
    });

    const pantry = TestBed.inject(PantryService);
    await pantry.refresh();

    fixture = TestBed.createComponent(PantryHostComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('DLC dans');
    expect(fixture.nativeElement.querySelector('.pantry__badge')).toBeTruthy();
  });

  it('shows filtered empty state when no near-expiry items match', async () => {
    const db = TestBed.inject(DatabaseService);
    await db.initialize();
    const product = await db.createProduct({ name: 'Pâtes' });
    const later = new Date();
    later.setDate(later.getDate() + 10);
    const expiryDate = `${later.getFullYear()}-${String(later.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(later.getDate()).padStart(2, '0')}`;

    await db.addPantryItem({ productId: product.id, quantityG: 300, expiryDate });

    fixture = TestBed.createComponent(PantryRoutedHostComponent);
    await TestBed.inject(Router).navigateByUrl('/pantry?filter=expiring');
    fixture.detectChanges();
    const pantry = TestBed.inject(PantryService);
    await pantry.refresh();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Aucune alerte DLC proche');
    expect(text).toContain('Afficher tout le stock');
  });

  it('applies the expiring filter from ?filter=expiring', async () => {
    const db = TestBed.inject(DatabaseService);
    await db.initialize();
    const near = await db.createProduct({ name: 'Yaourt' });
    const far = await db.createProduct({ name: 'Riz' });

    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const later = new Date();
    later.setDate(later.getDate() + 10);
    const format = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;

    await db.addPantryItem({
      productId: near.id,
      quantityG: 200,
      expiryDate: format(soon),
    });
    await db.addPantryItem({
      productId: far.id,
      quantityG: 500,
      expiryDate: format(later),
    });

    fixture = TestBed.createComponent(PantryRoutedHostComponent);
    await TestBed.inject(Router).navigateByUrl('/pantry?filter=expiring');
    fixture.detectChanges();
    const pantry = TestBed.inject(PantryService);
    await pantry.refresh();
    fixture.detectChanges();

    expect(pantry.filterMode()).toBe('expiring');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Yaourt');
    expect(text).not.toContain('Riz');

    await TestBed.inject(Router).navigateByUrl('/pantry');
    fixture.detectChanges();
    await pantry.refresh();
    fixture.detectChanges();

    expect(pantry.filterMode()).toBe('all');
    expect(fixture.nativeElement.textContent).toContain('Riz');
  });
});

