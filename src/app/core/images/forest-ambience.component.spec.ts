/**
 * @vitest-environment jsdom
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ForestAmbienceComponent } from './forest-ambience.component';

describe('ForestAmbienceComponent', () => {
  it('renders decorative landscape layers as aria-hidden', async () => {
    await TestBed.configureTestingModule({
      imports: [ForestAmbienceComponent],
    }).compileComponents();

    const fixture: ComponentFixture<ForestAmbienceComponent> = TestBed.createComponent(ForestAmbienceComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.forest-ambience') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.forest-ambience__landscape')).toBeTruthy();
    expect(root.querySelectorAll('.forest-ambience__bush').length).toBeGreaterThan(0);
  });
});
