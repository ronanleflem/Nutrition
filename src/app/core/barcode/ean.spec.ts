import { isValidEan, normalizeBarcodeInput } from './ean';

describe('ean', () => {
  it('accepts a valid EAN-13', () => {
    expect(isValidEan('3017620422003')).toBe(true);
  });

  it('accepts a valid EAN-8', () => {
    expect(isValidEan('96385074')).toBe(true);
  });

  it('rejects invalid check digit', () => {
    expect(isValidEan('3017620422004')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidEan('12345')).toBe(false);
  });

  it('normalizes non-digit characters', () => {
    expect(normalizeBarcodeInput('301-762-0422003')).toBe('3017620422003');
  });
});
