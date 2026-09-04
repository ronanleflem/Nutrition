import { describe, expect, it } from 'vitest';

import { isMaisonSurfaceUrl } from './maison-surface';

describe('isMaisonSurfaceUrl', () => {
  it('returns true for maison tab roots and sub-routes', () => {
    expect(isMaisonSurfaceUrl('/pantry')).toBe(true);
    expect(isMaisonSurfaceUrl('/recipes/new')).toBe(true);
    expect(isMaisonSurfaceUrl('/plan/synthesis')).toBe(true);
    expect(isMaisonSurfaceUrl('/products/scan')).toBe(true);
  });

  it('returns false for magasin nu surfaces', () => {
    expect(isMaisonSurfaceUrl('/home')).toBe(false);
    expect(isMaisonSurfaceUrl('/shopping')).toBe(false);
    expect(isMaisonSurfaceUrl('/shopping/mode')).toBe(false);
    expect(isMaisonSurfaceUrl('/goals')).toBe(false);
    expect(isMaisonSurfaceUrl('/settings')).toBe(false);
    expect(isMaisonSurfaceUrl('/onboarding')).toBe(false);
  });
});
