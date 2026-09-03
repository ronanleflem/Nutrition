import { IMAGE_WEBP_MIME, type ImageBlob } from '../models/image-blob';
import type { ProductReference } from '../models/product-reference';
import type { Recipe } from '../models/recipe';

import type { BackupData, BackupImageBlobRecord } from './backup-schema';

export interface PhotoRestoreSummary {
  photosRestored: number;
  photosMissing: number;
}

export function encodeImageBlobForBackup(blob: ImageBlob): BackupImageBlobRecord {
  return {
    id: blob.id,
    mimeType: blob.mimeType,
    dataBase64: arrayBufferToBase64(blob.data),
    createdAt: blob.createdAt,
  };
}

export function decodeImageBlobFromBackup(record: BackupImageBlobRecord): ImageBlob {
  return {
    id: record.id,
    mimeType: record.mimeType as typeof IMAGE_WEBP_MIME,
    data: base64ToArrayBuffer(record.dataBase64),
    createdAt: record.createdAt,
  };
}

export function collectReferencedBlobIds(
  data: Pick<BackupData, 'recipes' | 'productReferences'>,
): Set<string> {
  const ids = new Set<string>();

  for (const recipe of data.recipes) {
    if (recipe.photoBlobId) {
      ids.add(recipe.photoBlobId);
    }
  }

  for (const reference of data.productReferences) {
    if (reference.thumbBlobId) {
      ids.add(reference.thumbBlobId);
    }
  }

  return ids;
}

export function sanitizeBackupPhotoReferences(
  data: BackupData,
  availableBlobIds: ReadonlySet<string>,
): PhotoRestoreSummary {
  let photosRestored = 0;
  let photosMissing = 0;

  for (const recipe of data.recipes) {
    if (!recipe.photoBlobId) {
      continue;
    }

    if (availableBlobIds.has(recipe.photoBlobId)) {
      photosRestored += 1;
    } else {
      recipe.photoBlobId = undefined;
      photosMissing += 1;
    }
  }

  for (const reference of data.productReferences) {
    if (!reference.thumbBlobId) {
      continue;
    }

    if (availableBlobIds.has(reference.thumbBlobId)) {
      photosRestored += 1;
    } else {
      reference.thumbBlobId = undefined;
      photosMissing += 1;
    }
  }

  return { photosRestored, photosMissing };
}

export function mergeRecipePhotoBlobId(
  localRecipe: Recipe | undefined,
  importedRecipe: Recipe,
  availableBlobIds: ReadonlySet<string>,
): string | undefined {
  const importedPhotoId = importedRecipe.photoBlobId;
  if (importedPhotoId && availableBlobIds.has(importedPhotoId)) {
    return importedPhotoId;
  }

  const localPhotoId = localRecipe?.photoBlobId;
  if (localPhotoId && availableBlobIds.has(localPhotoId)) {
    return localPhotoId;
  }

  return undefined;
}

export function mergeReferenceThumbBlobId(
  localReference: ProductReference | undefined,
  importedReference: ProductReference,
  availableBlobIds: ReadonlySet<string>,
): string | undefined {
  const importedThumbId = importedReference.thumbBlobId;
  if (importedThumbId && availableBlobIds.has(importedThumbId)) {
    return importedThumbId;
  }

  const localThumbId = localReference?.thumbBlobId;
  if (localThumbId && availableBlobIds.has(localThumbId)) {
    return localThumbId;
  }

  return undefined;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}
