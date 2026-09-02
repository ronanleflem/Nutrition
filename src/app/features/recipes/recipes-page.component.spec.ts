import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RecipesPageComponent } from './recipes-page.component';
import { RecipesService } from './services/recipes.service';

describe('RecipesPageComponent', () => {
  let fixture: ComponentFixture<RecipesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipesPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesPageComponent);
    fixture.detectChanges();
  });

  it('shows empty state when no recipes', () => {
    const service = TestBed.inject(RecipesService);
    service.recipes.set([]);
    service.loading.set(false);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Ajoutez votre première recette');
  });
});
