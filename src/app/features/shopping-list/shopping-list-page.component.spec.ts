import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ShoppingListPageComponent } from './shopping-list-page.component';
import { ShoppingListService } from './services/shopping-list.service';

describe('ShoppingListPageComponent', () => {
  let fixture: ComponentFixture<ShoppingListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingListPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListPageComponent);
    fixture.detectChanges();
  });

  it('shows meal-plan empty state when there is no plan and no manual items', () => {
    const service = TestBed.inject(ShoppingListService);
    service.loading.set(false);
    service.items.set([]);
    service.hasPlanEntries.set(false);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Rien de prévu cette semaine');
    expect(text).toContain('Ouvrir le plan');
  });

  it('shows shopping-list empty state when plan exists but list is empty', () => {
    const service = TestBed.inject(ShoppingListService);
    service.loading.set(false);
    service.items.set([]);
    service.hasPlanEntries.set(true);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Liste vide pour l’instant');
    expect(text).toContain('Voir le plan');
  });
});
