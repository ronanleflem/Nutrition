/** Detects iOS / iPadOS where camera barcode scan is unreliable (NFR-10). */
export function isIosDevice(userAgent = readUserAgent()): boolean {
  if (!userAgent) {
    return false;
  }

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return true;
  }

  return userAgent.includes('Macintosh') && typeof document !== 'undefined' && 'ontouchend' in document;
}

function readUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}
