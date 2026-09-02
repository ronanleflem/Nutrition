import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CONTEXT_MENU_ACTIONS } from './context-shortcuts.models';
import { ContextActionMenuComponent } from './context-action-menu.component';

describe('ContextActionMenuComponent', () => {
  let fixture: ComponentFixture<ContextActionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextActionMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextActionMenuComponent);
  });

  it('shows the three product actions', () => {
    fixture.componentRef.setInput('target', {
      kind: 'product',
      productId: 'p1',
      productName: 'Skyr',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Skyr');
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
  });

  it('hides « Utiliser dans une recette » for a recipe target', () => {
    fixture.componentRef.setInput('target', {
      kind: 'recipe',
      recipeId: 'r1',
      recipeTitle: 'Omelette',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Omelette');
    expect(text).toContain(CONTEXT_MENU_ACTIONS.pantry);
    expect(text).toContain(CONTEXT_MENU_ACTIONS.shopping);
    expect(text).not.toContain(CONTEXT_MENU_ACTIONS.useInRecipe);
  });

  it('renders as a dialog, not a menu', () => {
    fixture.componentRef.setInput('target', {
      kind: 'product',
      productId: 'p1',
      productName: 'Skyr',
    });
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes on backdrop click and on ×', () => {
    fixture.componentRef.setInput('target', {
      kind: 'product',
      productId: 'p1',
      productName: 'Skyr',
    });
    fixture.detectChanges();

    const closed: string[] = [];
    fixture.componentInstance.closed.subscribe(() => closed.push('closed'));

    (fixture.nativeElement.querySelector('.sheet-backdrop') as HTMLElement).click();
    expect(closed).toEqual(['closed']);

    closed.length = 0;
    (fixture.nativeElement.querySelector('.sheet__close') as HTMLButtonElement).click();
    expect(closed).toEqual(['closed']);
  });

  it('ignores an immediate backdrop click after a long-press open', () => {
    fixture.componentRef.setInput('target', {
      kind: 'product',
      productId: 'p1',
      productName: 'Skyr',
    });
    fixture.componentRef.setInput('ignoreBackdrop', true);
    fixture.detectChanges();

    const closed: string[] = [];
    fixture.componentInstance.closed.subscribe(() => closed.push('closed'));

    (fixture.nativeElement.querySelector('.sheet-backdrop') as HTMLElement).click();
    expect(closed).toEqual([]);
  });
});
