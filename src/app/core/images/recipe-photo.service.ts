import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { ImageBlobService } from './image-blob.service';
import {
  RECIPE_PHOTO_ADD_ERROR,
  RECIPE_PHOTO_REPLACE_ERROR,
} from './recipe-photo.messages';

@Injectable({ providedIn: 'root' })
export class RecipePhotoService {
  private readonly database = inject(DatabaseService);
  private readonly imageBlobs = inject(ImageBlobService);

  async attachPhoto(recipeId: string, file: Blob): Promise<void> {
    const detail = await this.database.getRecipeDetail(recipeId);
    if (!detail) {
      throw new Error('Recette introuvable.');
    }

    const isReplace = detail.recipe.photoBlobId != null;

    try {
      const newId = await this.imageBlobs.replace(detail.recipe.photoBlobId, file);
      await this.database.updateRecipePhotoBlobId(recipeId, newId);
    } catch {
      throw new Error(isReplace ? RECIPE_PHOTO_REPLACE_ERROR : RECIPE_PHOTO_ADD_ERROR);
    }
  }

  async removePhoto(recipeId: string): Promise<void> {
    const detail = await this.database.getRecipeDetail(recipeId);
    if (!detail) {
      throw new Error('Recette introuvable.');
    }

    const previousId = detail.recipe.photoBlobId;
    await this.database.updateRecipePhotoBlobId(recipeId, null);

    if (previousId) {
      await this.imageBlobs.deleteIfUnreferenced(previousId);
    }
  }
}
