import { describe, expect, it } from 'vitest';

import { mapOffProductFields, readOffImageUrl } from './off-product-mapper';

describe('off-product-mapper', () => {
  it('maps OFF image URLs with front-small priority', () => {
    expect(
      readOffImageUrl({
        image_front_small_url: 'https://off.test/front-small.jpg',
        image_front_url: 'https://off.test/front.jpg',
        image_url: 'https://off.test/generic.jpg',
      }),
    ).toBe('https://off.test/front-small.jpg');
  });

  it('includes imageUrl in prefill when OFF provides a photo', () => {
    const prefill = mapOffProductFields('3017620422003', {
      product_name_fr: 'Nutella',
      image_front_url: 'https://off.test/nutella.jpg',
      nutriments: {
        'energy-kcal_100g': 539,
        proteins_100g: 6.3,
        fat_100g: 30.9,
        carbohydrates_100g: 57.5,
      },
    });

    expect(prefill.imageUrl).toBe('https://off.test/nutella.jpg');
  });

  it('omits imageUrl when OFF product has no image fields', () => {
    const prefill = mapOffProductFields('0000000000000', {
      product_name: 'Sans photo',
      nutriments: { 'energy-kcal_100g': 100 },
    });

    expect(prefill.imageUrl).toBeUndefined();
  });
});
