import { describe, expect, it } from 'vitest';

import { IMAGE_WEBP_MIME } from '../models/image-blob';
import {
  collectReferencedBlobIds,
  decodeImageBlobFromBackup,
  decodeImageBlobsFromBackup,
  encodeImageBlobForBackup,
  mergeRecipePhotoBlobId,
  mergeReferenceThumbBlobId,
  sanitizeBackupPhotoReferences,
  summarizeMergePhotoRestore,
} from './backup-image-blobs';
import type { BackupData } from './backup-schema';

describe('backup-image-blobs', () => {
  it('round-trips blob bytes through base64 backup records', () => {
    const source = new Uint8Array([1, 2, 3, 4]).buffer;
    const encoded = encodeImageBlobForBackup({
      id: 'blob-1',
      mimeType: IMAGE_WEBP_MIME,
      data: source,
      createdAt: '2026-09-03T00:00:00.000Z',
    });

    const decoded = decodeImageBlobFromBackup(encoded);
    expect(Array.from(new Uint8Array(decoded.data))).toEqual([1, 2, 3, 4]);
  });

  it('collects referenced recipe and product blob ids', () => {
    const ids = collectReferencedBlobIds({
      recipes: [{ photoBlobId: 'photo-1' } as BackupData['recipes'][number]],
      productReferences: [{ thumbBlobId: 'thumb-1' } as BackupData['productReferences'][number]],
    });

    expect([...ids]).toEqual(['photo-1', 'thumb-1']);
  });

  it('clears missing blob references and counts restored vs missing photos', () => {
    const data = {
      recipes: [{ photoBlobId: 'photo-1' }, { photoBlobId: 'missing-photo' }],
      productReferences: [{ thumbBlobId: 'thumb-1' }, { thumbBlobId: 'missing-thumb' }],
    } as BackupData;

    const summary = sanitizeBackupPhotoReferences(data, new Set(['photo-1', 'thumb-1']));

    expect(summary).toEqual({ photosRestored: 2, photosMissing: 2 });
    expect(data.recipes[1]?.photoBlobId).toBeUndefined();
    expect(data.productReferences[1]?.thumbBlobId).toBeUndefined();
  });

  it('prefers imported recipe photo when blob is present, otherwise keeps local', () => {
    const local = { photoBlobId: 'local-photo' } as BackupData['recipes'][number];
    const imported = { photoBlobId: 'import-photo' } as BackupData['recipes'][number];
    const available = new Set(['import-photo', 'local-photo']);

    expect(mergeRecipePhotoBlobId(local, imported, available)).toBe('import-photo');
    expect(mergeRecipePhotoBlobId(local, { photoBlobId: 'missing' } as BackupData['recipes'][number], available)).toBe(
      'local-photo',
    );
  });

  it('prefers imported reference thumb when blob is present, otherwise keeps local', () => {
    const local = { thumbBlobId: 'local-thumb' } as BackupData['productReferences'][number];
    const imported = { thumbBlobId: 'import-thumb' } as BackupData['productReferences'][number];
    const available = new Set(['import-thumb', 'local-thumb']);

    expect(mergeReferenceThumbBlobId(local, imported, available)).toBe('import-thumb');
  });

  it('filters invalid backup blob records during decode', () => {
    const decoded = decodeImageBlobsFromBackup([
      {
        id: 'blob-1',
        mimeType: IMAGE_WEBP_MIME,
        dataBase64: btoa(String.fromCharCode(1, 2, 3)),
        createdAt: '2026-09-03T00:00:00.000Z',
      },
      {
        id: 'blob-2',
        mimeType: IMAGE_WEBP_MIME,
        dataBase64: '%%%invalid%%%',
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ]);

    expect(decoded).toHaveLength(1);
    expect(decoded[0]?.id).toBe('blob-1');
  });

  it('counts only imported photos restored during merge', () => {
    const summary = summarizeMergePhotoRestore(
      {
        recipes: [{ id: 'recipe-1', photoBlobId: 'photo-import' } as BackupData['recipes'][number]],
        productReferences: [],
      },
      new Set(['photo-import']),
      [{ id: 'recipe-1', photoBlobId: 'photo-import' } as BackupData['recipes'][number]],
      [],
    );

    expect(summary).toEqual({ photosRestored: 1, photosMissing: 0 });
  });
});
