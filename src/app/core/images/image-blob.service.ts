import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { createImageBlob } from '../models/image-blob';
import { resizeImageToWebp, type ResizeImageToWebpOptions } from './image-webp.pipeline';

@Injectable({ providedIn: 'root' })
export class ImageBlobService {
  private readonly database = inject(DatabaseService);

  async storeFromFile(file: Blob, options?: ResizeImageToWebpOptions): Promise<string> {
    const webpData = await resizeImageToWebp(file, options);
    const entry = createImageBlob(await webpData.arrayBuffer());
    await this.database.putImageBlob(entry);
    return entry.id;
  }

  async get(id: string): Promise<Blob | undefined> {
    const entry = await this.database.getImageBlob(id);
    if (!entry) {
      return undefined;
    }
    return new Blob([entry.data], { type: entry.mimeType });
  }

  async delete(id: string): Promise<void> {
    await this.database.deleteImageBlob(id);
  }

  async replace(
    previousId: string | undefined,
    file: Blob,
    options?: ResizeImageToWebpOptions,
  ): Promise<string> {
    const newId = await this.storeFromFile(file, options);

    if (previousId && previousId !== newId) {
      await this.deleteIfUnreferenced(previousId);
    }

    return newId;
  }

  async deleteIfUnreferenced(id: string): Promise<void> {
    const referenced = await this.database.isImageBlobReferenced(id);
    if (!referenced) {
      await this.delete(id);
    }
  }
}
