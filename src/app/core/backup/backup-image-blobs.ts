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

export function isValidBackupImageBlobRecord(record: unknown): record is BackupImageBlobRecord {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const candidate = record as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['mimeType'] === 'string' &&
    typeof candidate['dataBase64'] === 'string' &&
    typeof candidate['createdAt'] === 'string'
  );
}

export function decodeImageBlobsFromBackup(records: BackupImageBlobRecord[]): ImageBlob[] {
  const decoded: ImageBlob[] = [];

  for (const record of records) {
    if (!isValidBackupImageBlobRecord(record)) {
      continue;
    }

    try {
      decoded.push(decodeImageBlobFromBackup(record));
    } catch {
      // Skip corrupt blob records instead of failing the whole import.
    }
  }

  return decoded;
}

export function summarizeMergePhotoRestore(
  importedData: Pick<BackupData, 'recipes' | 'productReferences'>,
  importedBlobIds: ReadonlySet<string>,
  mergedRecipes: Recipe[],
  mergedReferences: ProductReference[],
  referenceIdMap: ReadonlyMap<string, string> = new Map(),
): PhotoRestoreSummary {
  let photosRestored = 0;
  let photosMissing = 0;

  for (const importedRecipe of importedData.recipes) {
    if (!importedRecipe.photoBlobId) {
      continue;
    }

    const mergedRecipe = mergedRecipes.find((recipe) => recipe.id === importedRecipe.id);
    if (!mergedRecipe) {
      continue;
    }

    if (!importedBlobIds.has(importedRecipe.photoBlobId)) {
      photosMissing += 1;
      continue;
    }

    if (mergedRecipe.photoBlobId === importedRecipe.photoBlobId) {
      photosRestored += 1;
    } else {
      photosMissing += 1;
    }
  }

  for (const importedReference of importedData.productReferences) {
    if (!importedReference.thumbBlobId) {
      continue;
    }

    const mergedReferenceId = referenceIdMap.get(importedReference.id) ?? importedReference.id;
    const mergedReference = mergedReferences.find((reference) => reference.id === mergedReferenceId);
    if (!mergedReference) {
      continue;
    }

    if (!importedBlobIds.has(importedReference.thumbBlobId)) {
      photosMissing += 1;
      continue;
    }

    if (mergedReference.thumbBlobId === importedReference.thumbBlobId) {
      photosRestored += 1;
    } else {
      photosMissing += 1;
    }
  }

  return { photosRestored, photosMissing };
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
