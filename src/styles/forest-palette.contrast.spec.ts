import { contrastRatio, FOREST_PALETTE } from './forest-palette';

describe('Forest palette contrast (WCAG AA)', () => {
  it('ink-primary on surface-base meets AA for body text (4.5:1)', () => {
    expect(contrastRatio(FOREST_PALETTE.inkPrimary, FOREST_PALETTE.surfaceBase)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('ink-warm on surface-base meets AA for titles (4.5:1)', () => {
    expect(contrastRatio(FOREST_PALETTE.inkWarm, FOREST_PALETTE.surfaceBase)).toBeGreaterThanOrEqual(4.5);
  });

  it('ink-secondary on surface-base meets AA for metadata (4.5:1)', () => {
    expect(contrastRatio(FOREST_PALETTE.inkSecondary, FOREST_PALETTE.surfaceBase)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('accent-positive on surface-base meets AA for large UI (3:1)', () => {
    expect(contrastRatio(FOREST_PALETTE.accentPositive, FOREST_PALETTE.surfaceBase)).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('macro-met matches accent-positive (mousse)', () => {
    expect(FOREST_PALETTE.macroMet).toBe(FOREST_PALETTE.accentPositive);
    expect(FOREST_PALETTE.macroMet.toLowerCase()).toBe('#8fbc8f');
  });

  it('accent-warning terracotta on surface-base meets large UI contrast (3:1)', () => {
    expect(contrastRatio(FOREST_PALETTE.accentWarning, FOREST_PALETTE.surfaceBase)).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('accent-negative on surface-raised meets large UI contrast (3:1)', () => {
    expect(
      contrastRatio(FOREST_PALETTE.accentNegative, FOREST_PALETTE.surfaceRaised),
    ).toBeGreaterThanOrEqual(3);
  });
});
