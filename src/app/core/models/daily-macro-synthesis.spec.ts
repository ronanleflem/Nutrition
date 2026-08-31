import { buildMacroBars } from './daily-macro-synthesis';
import { MACRO_GOALS_SINGLETON_ID } from './macro-goals';
import { EMPTY_RECIPE_MACROS } from './recipe-macros';

describe('buildMacroBars', () => {
  it('builds value-only labels when goals are missing', () => {
    const bars = buildMacroBars(
      { ...EMPTY_RECIPE_MACROS, proteinG: 120 },
      { id: MACRO_GOALS_SINGLETON_ID },
    );

    expect(bars[1].valueLabel).toBe('120 g');
    expect(bars[1].state).toBe('neutral');
    expect(bars[1].fillPercent).toBe(0);
  });

  it('builds goal comparison labels and met state', () => {
    const bars = buildMacroBars(
      { ...EMPTY_RECIPE_MACROS, kcal: 1900 },
      { id: MACRO_GOALS_SINGLETON_ID, kcal: 2000 },
    );

    expect(bars[0].valueLabel).toContain('1');
    expect(bars[0].valueLabel).toContain('2');
    expect(bars[0].state).toBe('met');
    expect(bars[0].ariaLabel).toContain('kilocalories');
  });
});
