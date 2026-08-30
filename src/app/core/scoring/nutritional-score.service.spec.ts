import { TestBed } from '@angular/core/testing';

import { NutritionalScoreService } from './nutritional-score.service';

describe('NutritionalScoreService', () => {
  let service: NutritionalScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NutritionalScoreService);
  });

  it('scores high-protein low-calorie foods higher than sugary foods', () => {
    const skyrScore = service.calculate({
      kcalPer100g: 57,
      proteinPer100g: 10,
      fatPer100g: 0,
      carbsPer100g: 4,
    });

    const wrapScore = service.calculate({
      kcalPer100g: 290,
      proteinPer100g: 8,
      fatPer100g: 4,
      carbsPer100g: 52,
    });

    expect(skyrScore).toBeGreaterThan(wrapScore);
    expect(skyrScore).toBeGreaterThanOrEqual(0);
    expect(skyrScore).toBeLessThanOrEqual(100);
  });

  it('returns a stable score between 0 and 100', () => {
    const score = service.calculate({
      kcalPer100g: 110,
      proteinPer100g: 23,
      fatPer100g: 1,
      carbsPer100g: 0,
      fiberPer100g: 0,
      saltPer100g: 0.2,
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
