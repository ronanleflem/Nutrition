/**
 * @vitest-environment jsdom
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingService } from '../../../onboarding/onboarding.service';
import { RecipesService } from '../../services/recipes.service';
import { PhotoPromptPageComponent } from './photo-prompt-page.component';

@Component({ template: 'Accueil', standalone: true })
class DummyHomeComponent {}

describe('PhotoPromptPageComponent', () => {
  let fixture: ComponentFixture<PhotoPromptPageComponent>;
  let finishAfterPhotoPrompt: ReturnType<typeof vi.fn>;
  const originalMediaDevices = navigator.mediaDevices;

  async function createComponent(fromOnboarding = false): Promise<void> {
    finishAfterPhotoPrompt = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [PhotoPromptPageComponent],
      providers: [
        provideRouter([{ path: 'home', component: DummyHomeComponent }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'recipe-1' }),
              queryParamMap: convertToParamMap(fromOnboarding ? { from: 'onboarding' } : {}),
            },
          },
        },
        {
          provide: RecipesService,
          useValue: {
            getRecipeDetail: vi.fn().mockResolvedValue({
              recipe: { id: 'recipe-1', title: 'Omelette' },
              variants: [],
            }),
          },
        },
        {
          provide: OnboardingService,
          useValue: {
            finishAfterPhotoPrompt,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoPromptPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined }],
        }),
      },
    });
  });

  afterEach(() => {
    fixture?.destroy();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    TestBed.resetTestingModule();
  });

  it('shows the prompt copy and the primary gallery action', async () => {
    await createComponent();

    expect(fixture.nativeElement.querySelector('.photo-prompt__title')?.textContent).toContain(
      'Ajouter une photo ?',
    );
    expect(fixture.nativeElement.textContent).toContain('Omelette');
    expect(fixture.nativeElement.querySelector('.photo-prompt__button--primary')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.photo-prompt__button--secondary')).toBeTruthy();
  });

  it('completes onboarding when Plus tard is chosen from onboarding', async () => {
    await createComponent(true);

    await fixture.componentInstance.onLater();

    expect(finishAfterPhotoPrompt).toHaveBeenCalledTimes(1);
  });
});
