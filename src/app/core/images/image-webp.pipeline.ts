import { IMAGE_WEBP_MIME } from '../models/image-blob';

export const DEFAULT_MAX_IMAGE_WIDTH = 1200;
export const DEFAULT_WEBP_QUALITY = 0.82;

export interface ResizeImageToWebpOptions {
  maxWidth?: number;
  quality?: number;
}

const IMAGE_MIME_PREFIX = 'image/';

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith(IMAGE_MIME_PREFIX);
}

export async function resizeImageToWebp(
  file: Blob,
  options: ResizeImageToWebpOptions = {},
): Promise<Blob> {
  if (file.type && !isImageMimeType(file.type)) {
    throw new Error(`Type MIME non pris en charge : ${file.type}`);
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH;
  const quality = options.quality ?? DEFAULT_WEBP_QUALITY;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Contexte canvas indisponible');
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Échec de l’encodage WebP'));
        },
        IMAGE_WEBP_MIME,
        quality,
      );
    });

    return webpBlob;
  } finally {
    bitmap.close();
  }
}
