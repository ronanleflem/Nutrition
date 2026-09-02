import { describe, expect, it } from 'vitest';

import { translateUsdaSearchQuery } from './usda-query-translate';

describe('translateUsdaSearchQuery', () => {
  it('replaces French aliases with English terms', () => {
    const aliases = { œuf: 'egg', poulet: 'chicken' };

    expect(translateUsdaSearchQuery('Œuf bio', aliases)).toBe('egg bio');
    expect(translateUsdaSearchQuery('filet poulet', aliases)).toBe('filet chicken');
  });

  it('returns trimmed query when no alias matches', () => {
    expect(translateUsdaSearchQuery('  quinoa  ', {})).toBe('quinoa');
  });
});
