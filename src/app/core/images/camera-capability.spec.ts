/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isPermissionDeniedError,
  probeCameraAvailability,
  supportsCameraCaptureInput,
} from './camera-capability';

describe('camera-capability', () => {
  const originalMediaDevices = navigator.mediaDevices;
  const originalPermissions = navigator.permissions;

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: originalPermissions,
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
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: async () => ({ state: 'denied' }),
      },
    });

    expect(await probeCameraAvailability()).toBe('denied');
  });

  it('does not call getUserMedia when probing availability', async () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    await probeCameraAvailability();

    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('detects permission denied errors', () => {
    expect(isPermissionDeniedError({ name: 'NotAllowedError' })).toBe(true);
    expect(isPermissionDeniedError(new Error('other'))).toBe(false);
  });
});
