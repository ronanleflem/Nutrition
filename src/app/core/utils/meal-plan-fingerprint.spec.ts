import type { MealPlanEntry } from '../models/meal-plan-entry';
import { computeMealPlanFingerprint } from './meal-plan-fingerprint';

describe('computeMealPlanFingerprint', () => {
  it('orders entries by date then slot', () => {
    const entries: MealPlanEntry[] = [
      {
        id: '2',
        date: '2026-08-31',
        slot: 'dinner',
        recipeId: 'r1',
      },
      {
        id: '1',
        date: '2026-08-31',
        slot: 'breakfast',
        recipeId: 'r2',
        recipeVariantId: 'v1',
      },
    ];

    expect(computeMealPlanFingerprint(entries)).toBe(
      '2026-08-31:breakfast:r2:v1|2026-08-31:dinner:r1:',
    );
  });
});
