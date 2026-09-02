import { foodCategoryLabelFromHit } from './food-category-from-hit';

describe('foodCategoryLabelFromHit', () => {
  it('prefers hit.category when set', () => {
    expect(foodCategoryLabelFromHit({ source: 'catalog', category: 'LAITIER' })).toBe('LAITIER');
  });

  it('uses Ciqual subtitle when no category', () => {
    expect(foodCategoryLabelFromHit({ source: 'ciqual', subtitle: 'fruits' })).toBe('fruits');
  });

  it('ignores OpenNutrition subtitle (brand only)', () => {
    expect(
      foodCategoryLabelFromHit({ source: 'opennutrition', subtitle: 'Danone' }),
    ).toBeUndefined();
  });

  it('returns undefined when nothing is available', () => {
    expect(foodCategoryLabelFromHit({ source: 'catalog' })).toBeUndefined();
  });
});
