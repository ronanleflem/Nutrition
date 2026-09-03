/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { deleteNutritionDatabase } from '../database/nutrition-database.testing';
import { NUTRITION_DB_NAME } from '../database/nutrition-database';
import { IMAGE_WEBP_MIME } from '../models/image-blob';
import { ImageBlobService } from './image-blob.service';
import { ProductThumbComponent } from './product-thumb.component';

describe('ProductThumbComponent', () => {
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock-thumb');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      imports: [ProductThumbComponent],
    });

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('shows a decorative local image when a thumb blob is linked', async () => {
    const id = crypto.randomUUID();
    await database.putImageBlob({
      id,
      mimeType: IMAGE_WEBP_MIME,
      data: new ArrayBuffer(8),
      createdAt: new Date().toISOString(),
    });

    const fixture = TestBed.createComponent(ProductThumbComponent);
    fixture.componentRef.setInput('thumbBlobId', id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.product-thumb__image') as HTMLImageElement;
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('aria-hidden')).toBe('true');
    expect(image.getAttribute('src')).toBe('blob:mock-thumb');
  });

  it('shows a category picto when no thumb blob exists', async () => {
    const fixture = TestBed.createComponent(ProductThumbComponent);
    fixture.componentRef.setInput('category', 'Fruits');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.product-thumb__fallback svg')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.product-thumb__image')).toBeNull();
  });

  it('uses previewUrl before falling back to the category picto', async () => {
    const fixture = TestBed.createComponent(ProductThumbComponent);
    fixture.componentRef.setInput('previewUrl', 'https://off.test/preview.jpg');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.product-thumb__image') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://off.test/preview.jpg');
  });
});
