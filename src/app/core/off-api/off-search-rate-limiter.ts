const MAX_REQUESTS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

export class OffSearchRateLimiter {
  private readonly timestamps: number[] = [];

  canRequest(now = Date.now()): boolean {
    this.prune(now);
    return this.timestamps.length < MAX_REQUESTS_PER_MINUTE;
  }

  recordRequest(now = Date.now()): void {
    this.prune(now);
    this.timestamps.push(now);
  }

  msUntilNextSlot(now = Date.now()): number {
    this.prune(now);
    if (this.timestamps.length < MAX_REQUESTS_PER_MINUTE) {
      return 0;
    }

    const oldest = this.timestamps[0];
    return Math.max(0, WINDOW_MS - (now - oldest));
  }

  reset(): void {
    this.timestamps.length = 0;
  }

  private prune(now: number): void {
    while (this.timestamps.length > 0 && now - this.timestamps[0] >= WINDOW_MS) {
      this.timestamps.shift();
    }
  }
}
