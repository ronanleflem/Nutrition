export const IMAGE_WEBP_MIME = 'image/webp' as const;

export interface ImageBlob {
  id: string;
  mimeType: typeof IMAGE_WEBP_MIME;
  data: ArrayBuffer;
  createdAt: string;
}

export function createImageBlob(data: ArrayBuffer, id = crypto.randomUUID()): ImageBlob {
  return {
    id,
    mimeType: IMAGE_WEBP_MIME,
    data,
    createdAt: new Date().toISOString(),
  };
}
