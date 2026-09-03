/**
 * @vitest-environment jsdom
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { SurfaceBannerComponent } from './surface-banner.component';

describe('SurfaceBannerComponent', () => {
  let fixture: ComponentFixture<SurfaceBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurfaceBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SurfaceBannerComponent);
  });

  it('renders the pantry shelves scene with aria-hidden', () => {
    fixture.componentRef.setInput('variant', 'pantry');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.surface-banner') as HTMLElement;
    expect(banner.getAttribute('aria-hidden')).toBe('true');
    expect(banner.classList.contains('surface-banner--pantry')).toBe(true);
    expect(banner.querySelector('.surface-banner__jar')).toBeTruthy();
    expect(banner.querySelector('.surface-banner__hill')).toBeTruthy();
  });

  it('renders the recipes plate scene', () => {
    fixture.componentRef.setInput('variant', 'recipes');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.surface-banner') as HTMLElement;
    expect(banner.querySelector('.surface-banner__plate')).toBeTruthy();
    expect(banner.querySelector('.surface-banner__food')).toBeTruthy();
  });

  it('renders the plan week-table scene', () => {
    fixture.componentRef.setInput('variant', 'plan');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.surface-banner') as HTMLElement;
    expect(banner.querySelector('.surface-banner__calendar')).toBeTruthy();
    expect(banner.querySelector('.surface-banner__meal-dot')).toBeTruthy();
  });
});
