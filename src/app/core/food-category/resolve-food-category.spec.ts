import { resolveFoodCategory } from './resolve-food-category';

describe('resolveFoodCategory', () => {
  it('returns null for empty category', () => {
    expect(resolveFoodCategory('')).toBeNull();
    expect(resolveFoodCategory(undefined)).toBeNull();
  });

  it('maps uppercase catalogue codes', () => {
    expect(resolveFoodCategory('VIANDE')).toBe('viande');
    expect(resolveFoodCategory('LAITIER')).toBe('laitiers');
    expect(resolveFoodCategory('SAUCE')).toBe('sauces');
  });

  it('maps Ciqual-style French categories', () => {
    expect(resolveFoodCategory('œufs de poule')).toBe('oeufs');
    expect(resolveFoodCategory('fruits')).toBe('fruits');
    expect(resolveFoodCategory('féculents')).toBe('feculents');
    expect(resolveFoodCategory('produits laitiers')).toBe('laitiers');
    expect(resolveFoodCategory('fromages à pâte pressée ou dure')).toBe('laitiers');
    expect(resolveFoodCategory('abats')).toBe('viande');
  });

  it('falls back to autres for unknown labels', () => {
    expect(resolveFoodCategory('DIVERS')).toBe('autres');
  });
});
