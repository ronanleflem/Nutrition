import { OffSearchRateLimiter } from './off-search-rate-limiter';

describe('OffSearchRateLimiter', () => {
  it('allows up to 10 requests per minute', () => {
    const limiter = new OffSearchRateLimiter();
    const now = Date.now();

    for (let index = 0; index < 10; index++) {
      expect(limiter.canRequest(now)).toBe(true);
      limiter.recordRequest(now);
    }

    expect(limiter.canRequest(now)).toBe(false);
    expect(limiter.msUntilNextSlot(now)).toBeGreaterThan(0);
  });

  it('opens a slot after the sliding window expires', () => {
    const limiter = new OffSearchRateLimiter();
    const start = Date.now();

    for (let index = 0; index < 10; index++) {
      limiter.recordRequest(start);
    }

    expect(limiter.canRequest(start + 60_000)).toBe(true);
  });
});
