import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { EmptyStateComponent } from './empty-state.component';
import { EMPTY_STATE_PRESETS } from './empty-state.presets';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
  });

  it('renders nature illustration and warm copy for products variant', () => {
    fixture.componentRef.setInput('variant', 'products');
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.empty-state-illustration')).toBeTruthy();
    expect(element.textContent).toContain(EMPTY_STATE_PRESETS.products.title);
    expect(element.textContent).toContain('bibliothèque');
    expect(element.textContent).toContain('Créer un produit');
  });

  it('hides illustration when showIllustration is false', () => {
    fixture.componentRef.setInput('variant', 'pantry');
    fixture.componentRef.setInput('showIllustration', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state-illustration')).toBeNull();
  });

  it('emits ctaClicked for button CTA', () => {
    fixture.componentRef.setInput('variant', 'pantry');
    fixture.componentRef.setInput('ctaAsButton', true);
    fixture.detectChanges();

    const clicked = vi.fn();
    fixture.componentInstance.ctaClicked.subscribe(clicked);

    const button = fixture.nativeElement.querySelector('.empty-state__cta') as HTMLButtonElement;
    button.click();

    expect(clicked).toHaveBeenCalledTimes(1);
  });
});
