import { compareMacroToGoal, macroBarFillPercent } from './macro-bar-state';

describe('macro-bar-state', () => {
  it('returns neutral when goal is undefined', () => {
    expect(compareMacroToGoal(120, undefined)).toBe('neutral');
    expect(macroBarFillPercent(120, undefined)).toBe(0);
  });

  it('returns under when actual is below goal minus 5%', () => {
    expect(compareMacroToGoal(140, 150)).toBe('under');
  });

  it('returns met when actual is within ±5% of goal', () => {
    expect(compareMacroToGoal(148, 150)).toBe('met');
    expect(compareMacroToGoal(152, 150)).toBe('met');
  });

  it('returns over when actual exceeds goal plus 5%', () => {
    expect(compareMacroToGoal(160, 150)).toBe('over');
  });

  it('caps fill percent at 100', () => {
    expect(macroBarFillPercent(2200, 2000)).toBe(100);
  });

  it('computes fill percent from actual and goal', () => {
    expect(macroBarFillPercent(1500, 2000)).toBe(75);
  });
});
