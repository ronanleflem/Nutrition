/** Palette forêt — miroir de `src/styles/_tokens.scss` pour tests de contraste. */
export const FOREST_PALETTE = {
  surfaceBase: '#1a1f1a',
  surfaceRaised: '#242b24',
  inkPrimary: '#f5f5f5',
  inkSecondary: '#b8c4b8',
  inkWarm: '#e8e0d4',
  accentPositive: '#8fbc8f',
  accentWarning: '#c4a77d',
  accentNegative: '#d98a7a',
  macroMet: '#8fbc8f',
} as const;

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(parseHex(foreground));
  const l2 = relativeLuminance(parseHex(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
