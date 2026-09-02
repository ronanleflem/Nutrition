export type CameraAvailability = 'available' | 'denied' | 'unavailable';

export async function probeCameraAvailability(): Promise<CameraAvailability> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unavailable';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return 'available';
  } catch (error) {
    const errorName =
      typeof error === 'object' && error != null && 'name' in error
        ? String((error as { name: string }).name)
        : '';

    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return 'denied';
    }

    return 'unavailable';
  }
}

export function supportsCameraCaptureInput(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'mediaDevices' in navigator;
}
