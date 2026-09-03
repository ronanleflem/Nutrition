/**
 * @vitest-environment jsdom
 */
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OFF_PRODUCT_THUMB_MAX_WIDTH } from '../off-api/off-product-mapper';
import { ImageBlobService } from './image-blob.service';
import { OffProductThumbService } from './off-product-thumb.service';

describe('OffProductThumbService', () => {
  it('fetches an OFF image at import time and stores it locally', async () => {
    const storeFromFile = vi.fn().mockResolvedValue('blob-off-1');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['jpeg'], { type: 'image/jpeg' }),
    } as Response);

    TestBed.configureTestingModule({
      providers: [{ provide: ImageBlobService, useValue: { storeFromFile } }],
    });

    const service = TestBed.inject(OffProductThumbService);
    const blobId = await service.importFromUrl('https://off.test/product.jpg');

    expect(fetchMock).toHaveBeenCalledWith('https://off.test/product.jpg', {
      signal: expect.any(AbortSignal),
    });
    expect(storeFromFile).toHaveBeenCalledWith(expect.any(Blob), {
      maxWidth: OFF_PRODUCT_THUMB_MAX_WIDTH,
    });
    expect(blobId).toBe('blob-off-1');
  });

  it('returns undefined when the OFF image fetch fails', async () => {
    const storeFromFile = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);

    TestBed.configureTestingModule({
      providers: [{ provide: ImageBlobService, useValue: { storeFromFile } }],
    });

    const service = TestBed.inject(OffProductThumbService);
    await expect(service.importFromUrl('https://off.test/missing.jpg')).resolves.toBeUndefined();
    expect(storeFromFile).not.toHaveBeenCalled();
  });
});
