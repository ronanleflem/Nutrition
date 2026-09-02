/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IMAGE_WEBP_MIME } from '../models/image-blob';
import {
  DEFAULT_MAX_IMAGE_WIDTH,
  isImageMimeType,
  resizeImageToWebp,
} from './image-webp.pipeline';

describe('image-webp.pipeline', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts image MIME types', () => {
    expect(isImageMimeType('image/png')).toBe(true);
    expect(isImageMimeType('image/jpeg')).toBe(true);
    expect(isImageMimeType('text/plain')).toBe(false);
  });

  it('rejects non-image MIME types', async () => {
    const file = new Blob(['not-an-image'], { type: 'text/plain' });

    await expect(resizeImageToWebp(file)).rejects.toThrow(/Type MIME non pris en charge/);
  });

  it('downscales images wider than the max width', async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['webp'], { type: IMAGE_WEBP_MIME }));
    });

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName !== 'canvas') {
        throw new Error(`Unexpected element: ${tagName}`);
      }

      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toBlob,
      } as unknown as HTMLCanvasElement;
    });

    globalThis.createImageBitmap = vi.fn(async () => ({
      width: 2400,
      height: 1200,
      close: vi.fn(),
    })) as typeof createImageBitmap;

    const input = new Blob(['png'], { type: 'image/png' });
    const output = await resizeImageToWebp(input, { maxWidth: DEFAULT_MAX_IMAGE_WIDTH, quality: 0.82 });

    expect(output.type).toBe(IMAGE_WEBP_MIME);
    expect(drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ width: 2400, height: 1200 }),
      0,
      0,
      DEFAULT_MAX_IMAGE_WIDTH,
      600,
    );
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), IMAGE_WEBP_MIME, 0.82);

    globalThis.createImageBitmap = originalCreateImageBitmap;
  });

  it('does not upscale small images', async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['webp'], { type: IMAGE_WEBP_MIME }));
    });

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName !== 'canvas') {
        throw new Error(`Unexpected element: ${tagName}`);
      }

      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toBlob,
      } as unknown as HTMLCanvasElement;
    });

    globalThis.createImageBitmap = vi.fn(async () => ({
      width: 400,
      height: 300,
      close: vi.fn(),
    })) as typeof createImageBitmap;

    await resizeImageToWebp(new Blob(['png'], { type: 'image/png' }));

    expect(drawImage).toHaveBeenCalledWith(expect.objectContaining({ width: 400, height: 300 }), 0, 0, 400, 300);

    globalThis.createImageBitmap = originalCreateImageBitmap;
  });
});
