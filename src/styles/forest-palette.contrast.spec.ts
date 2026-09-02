import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrastRatio, FOREST_PALETTE } from './forest-palette';

const FOREST_TOKEN_VARS: Record<keyof typeof FOREST_PALETTE, string> = {
  surfaceBase: '--color-surface-base',
  surfaceRaised: '--color-surface-raised',
  inkPrimary: '--color-ink-primary',
  inkSecondary: '--color-ink-secondary',
  inkWarm: '--color-ink-warm',
  accentPositive: '--color-accent-positive',
  accentWarning: '--color-accent-warning',
  accentNegative: '--color-accent-negative',
  macroMet: '--color-macro-met',
};

function readDarkThemeToken(scss: string, cssVar: string): string {
  const match = scss.match(new RegExp(`${cssVar}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) {
    throw new Error(`Missing token ${cssVar} in _tokens.scss`);
  }

  return match[1].toLowerCase();
}

describe('Forest palette contrast (WCAG AA)', () => {
  it('mirrors _tokens.scss dark theme values', () => {
    const scssPath = join(dirname(fileURLToPath(import.meta.url)), '_tokens.scss');
    const scss = readFileSync(scssPath, 'utf8');

    for (const [key, cssVar] of Object.entries(FOREST_TOKEN_VARS) as Array<
      [keyof typeof FOREST_PALETTE, string]
    >) {
      expect(readDarkThemeToken(scss, cssVar)).toBe(FOREST_PALETTE[key]);
    }
  });

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
