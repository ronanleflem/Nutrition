import { isIosDevice } from './is-ios';

describe('isIosDevice', () => {
  it('detects iPhone user agent', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });

  it('detects Android user agent', () => {
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 7)')).toBe(false);
  });
});
