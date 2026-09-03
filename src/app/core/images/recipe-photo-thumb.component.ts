import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  resource,
} from '@angular/core';

import { ImageBlobService } from './image-blob.service';
import { RecipePhotoPlaceholderComponent } from './recipe-photo-placeholder.component';

export type RecipePhotoThumbSize = 'list' | 'plan' | 'hero';

@Component({
  selector: 'app-recipe-photo-thumb',
  imports: [RecipePhotoPlaceholderComponent],
  templateUrl: './recipe-photo-thumb.component.html',
  styleUrl: './recipe-photo-thumb.component.scss',
  host: {
    class: 'recipe-photo-thumb',
    '[class.recipe-photo-thumb--list]': 'size() === "list"',
    '[class.recipe-photo-thumb--plan]': 'size() === "plan"',
    '[class.recipe-photo-thumb--hero]': 'size() === "hero"',
  },
})
export class RecipePhotoThumbComponent implements OnDestroy {
  private readonly imageBlobs = inject(ImageBlobService);

  readonly photoBlobId = input<string | undefined>();
  readonly size = input<RecipePhotoThumbSize>('list');
  readonly alt = input('');

  readonly photoResource = resource({
    params: () => this.photoBlobId(),
    loader: async ({ params: blobId, abortSignal }) => {
      if (!blobId) {
        return null;
      }

      const blob = await this.imageBlobs.get(blobId);
      if (abortSignal.aborted || !blob) {
        return null;
      }

      return URL.createObjectURL(blob);
    },
  });

  readonly objectUrl = computed(() => this.photoResource.value() ?? null);
  readonly loading = computed(() => this.photoResource.isLoading());

  readonly imageAlt = computed(() => {
    if (this.size() !== 'hero' || !this.objectUrl()) {
      return '';
    }

    return this.alt();
  });
  readonly isDecorative = computed(() => this.size() !== 'hero' || !this.objectUrl());

  constructor() {
    effect((onCleanup) => {
      const url = this.photoResource.value();
      if (url) {
        onCleanup(() => URL.revokeObjectURL(url));
      }
    });
  }

  ngOnDestroy(): void {
    const url = this.photoResource.value();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
