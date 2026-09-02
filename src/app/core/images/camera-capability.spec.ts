/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { probeCameraAvailability, supportsCameraCaptureInput } from './camera-capability';

describe('camera-capability', () => {
  const originalMediaDevices = navigator.mediaDevices;

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('detects camera support from mediaDevices', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });

    expect(supportsCameraCaptureInput()).toBe(true);
  });

  it('returns denied when camera permission is refused', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          const error = new Error('denied');
          error.name = 'NotAllowedError';
          throw error;
        },
      },
    });

    expect(await probeCameraAvailability()).toBe('denied');
  });
});
