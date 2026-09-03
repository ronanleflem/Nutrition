export type CameraAvailability = 'available' | 'denied' | 'unavailable';

export async function probeCameraAvailability(): Promise<CameraAvailability> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unavailable';
  }

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (status.state === 'denied') {
        return 'denied';
      }

      return 'available';
    } catch {
      // Permissions API may not support the camera name on this browser.
    }
  }

  return 'available';
}

export function supportsCameraCaptureInput(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'mediaDevices' in navigator;
}

export function isPermissionDeniedError(error: unknown): boolean {
  if (typeof error !== 'object' || error == null || !('name' in error)) {
    return false;
  }

  const name = String((error as { name: string }).name);
  return name === 'NotAllowedError' || name === 'PermissionDeniedError';
}
