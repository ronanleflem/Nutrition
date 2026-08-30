/** Validates EAN-8 and EAN-13 barcodes (check digit). */
export function isValidEan(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length !== 8 && digits.length !== 13) {
    return false;
  }

  const body = digits.slice(0, -1);
  const checkDigit = Number(digits.at(-1));
  if (!Number.isFinite(checkDigit)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < body.length; index++) {
    const digit = Number(body[body.length - 1 - index]);
    if (!Number.isFinite(digit)) {
      return false;
    }
    sum += digit * (index % 2 === 0 ? 3 : 1);
  }

  const expected = (10 - (sum % 10)) % 10;
  return expected === checkDigit;
}

export function normalizeBarcodeInput(value: string): string {
  return value.replace(/\D/g, '');
}
