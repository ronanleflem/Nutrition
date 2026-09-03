import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  resource,
} from '@angular/core';

import { resolveFoodCategory } from '../food-category/resolve-food-category';
import type { FoodCategoryKind } from '../food-category/food-category.types';
import { FoodCategoryIconComponent } from '../ui/food-category-label/food-category-label.component';
import { ImageBlobService } from './image-blob.service';

@Component({
  selector: 'app-product-thumb',
  imports: [FoodCategoryIconComponent],
  templateUrl: './product-thumb.component.html',
  styleUrl: './product-thumb.component.scss',
  host: {
    class: 'product-thumb',
  },
})
export class ProductThumbComponent implements OnDestroy {
  private readonly imageBlobs = inject(ImageBlobService);

  readonly thumbBlobId = input<string | undefined>();
  readonly category = input<string | undefined>();
  readonly previewUrl = input<string | undefined>();

  readonly thumbResource = resource({
    params: () => this.thumbBlobId(),
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

  readonly objectUrl = computed(() => this.thumbResource.value() ?? null);
  readonly loading = computed(() => this.thumbResource.isLoading());
  readonly displayUrl = computed(() => this.objectUrl() ?? this.previewUrl() ?? null);

  readonly fallbackKind = computed<FoodCategoryKind>(() => resolveFoodCategory(this.category()) ?? 'autres');

  constructor() {
    effect((onCleanup) => {
      const url = this.thumbResource.value();
      if (url) {
        onCleanup(() => URL.revokeObjectURL(url));
      }
    });
  }

  ngOnDestroy(): void {
    const url = this.thumbResource.value();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
