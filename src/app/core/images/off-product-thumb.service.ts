import { inject, Injectable } from '@angular/core';

import { OFF_PRODUCT_THUMB_MAX_WIDTH } from '../off-api/off-product-mapper';
import { ImageBlobService } from './image-blob.service';
import { isImageMimeType } from './image-webp.pipeline';

const OFF_IMAGE_FETCH_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class OffProductThumbService {
  private readonly imageBlobs = inject(ImageBlobService);

  async importFromUrl(imageUrl: string | undefined): Promise<string | undefined> {
    const url = imageUrl?.trim();
    if (!url) {
      return undefined;
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(OFF_IMAGE_FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        return undefined;
      }

      const blob = await response.blob();
      if (!isImageMimeType(blob.type)) {
        return undefined;
      }

      return await this.imageBlobs.storeFromFile(blob, { maxWidth: OFF_PRODUCT_THUMB_MAX_WIDTH });
    } catch {
      return undefined;
    }
  }
}
