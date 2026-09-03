import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { probeCameraAvailability, supportsCameraCaptureInput, isPermissionDeniedError } from '../../../../core/images/camera-capability';
import {
  RECIPE_PHOTO_ADD_ERROR,
  RECIPE_PHOTO_CAMERA_DENIED,
  RECIPE_PHOTO_GALLERY_DENIED,
} from '../../../../core/images/recipe-photo.messages';
import { RecipePhotoPlaceholderComponent } from '../../../../core/images/recipe-photo-placeholder.component';
import { RecipePhotoService } from '../../../../core/images/recipe-photo.service';
import { OnboardingService } from '../../../onboarding/onboarding.service';
import { RecipesService } from '../../services/recipes.service';

@Component({
  selector: 'app-photo-prompt-page',
  imports: [RecipePhotoPlaceholderComponent],
  templateUrl: './photo-prompt-page.component.html',
  styleUrl: './photo-prompt-page.component.scss',
})
export class PhotoPromptPageComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly recipePhoto = inject(RecipePhotoService);
  private readonly onboarding = inject(OnboardingService);

  private readonly galleryButton = viewChild<ElementRef<HTMLButtonElement>>('galleryButton');

  readonly recipeTitle = signal('');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly showCamera = signal(true);
  readonly showGallery = signal(true);
  readonly infoMessage = signal<string | null>(null);

  private recipeId: string | null = null;
  private fromOnboarding = false;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/recipes']);
      return;
    }

    this.recipeId = id;
    this.fromOnboarding = this.route.snapshot.queryParamMap.get('from') === 'onboarding';

    try {
      const detail = await this.recipesService.getRecipeDetail(id);
      if (!detail) {
        this.loadError.set('Recette introuvable.');
        return;
      }

      this.recipeTitle.set(detail.recipe.title);
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Impossible de charger la recette.');
    } finally {
      this.loading.set(false);
    }

    await this.configureCameraAvailability();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.galleryButton()?.nativeElement.focus();
    });
  }

  openGalleryPicker(input: HTMLInputElement): void {
    void this.openFilePicker(input, 'gallery');
  }

  openCameraPicker(input: HTMLInputElement): void {
    void this.openFilePicker(input, 'camera');
  }

  private async openFilePicker(
    input: HTMLInputElement,
    source: 'gallery' | 'camera',
  ): Promise<void> {
    try {
      if ('showPicker' in input && typeof input.showPicker === 'function') {
        await input.showPicker();
        return;
      }

      input.click();
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        return;
      }

      if (source === 'camera') {
        this.showCamera.set(false);
        this.infoMessage.set(RECIPE_PHOTO_CAMERA_DENIED);
        return;
      }

      this.showGallery.set(false);
      this.infoMessage.set(RECIPE_PHOTO_GALLERY_DENIED);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || !this.recipeId) {
      return;
    }

    await this.savePhoto(file);
  }

  async onLater(): Promise<void> {
    await this.exitPrompt();
  }

  private async savePhoto(file: Blob): Promise<void> {
    if (!this.recipeId) {
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);

    try {
      await this.recipePhoto.attachPhoto(this.recipeId, file);
      await this.exitPrompt();
    } catch (error) {
      this.actionError.set(
        error instanceof Error ? error.message : RECIPE_PHOTO_ADD_ERROR,
      );
    } finally {
      this.saving.set(false);
    }
  }

  private async exitPrompt(): Promise<void> {
    if (!this.recipeId) {
      return;
    }

    if (this.fromOnboarding) {
      await this.onboarding.finishAfterPhotoPrompt();
      return;
    }

    await this.router.navigate(['/recipes', this.recipeId]);
  }

  private async configureCameraAvailability(): Promise<void> {
    if (!supportsCameraCaptureInput()) {
      this.showCamera.set(false);
      return;
    }

    const availability = await probeCameraAvailability();
    if (availability === 'denied') {
      this.showCamera.set(false);
      this.infoMessage.set(RECIPE_PHOTO_CAMERA_DENIED);
      return;
    }

    if (availability === 'unavailable') {
      this.showCamera.set(false);
    }
  }
}