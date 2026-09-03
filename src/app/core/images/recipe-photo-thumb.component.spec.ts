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
import { RecipePhotoThumbComponent } from './recipe-photo-thumb.component';

describe('RecipePhotoThumbComponent', () => {
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock-photo');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      imports: [RecipePhotoThumbComponent],
    });

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  it('shows the shared placeholder when no photo is linked', async () => {
    const fixture = TestBed.createComponent(RecipePhotoThumbComponent);
    fixture.componentRef.setInput('size', 'list');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-recipe-photo-placeholder')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('renders a hero image with the recipe title as alt text', async () => {
    await database.putImageBlob({
      id: 'blob-hero',
      mimeType: IMAGE_WEBP_MIME,
      data: await new Blob(['webp'], { type: IMAGE_WEBP_MIME }).arrayBuffer(),
      createdAt: new Date().toISOString(),
    });

    expect(await TestBed.inject(ImageBlobService).get('blob-hero')).toBeTruthy();

    const fixture = TestBed.createComponent(RecipePhotoThumbComponent);
    fixture.componentRef.setInput('size', 'hero');
    fixture.componentRef.setInput('photoBlobId', 'blob-hero');
    fixture.componentRef.setInput('alt', 'Wrap poulet');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.objectUrl()).toBe('blob:mock-photo');
    expect(image).toBeTruthy();
    expect(image?.alt).toBe('Wrap poulet');
    expect(image?.getAttribute('aria-hidden')).toBeNull();
  });
});
