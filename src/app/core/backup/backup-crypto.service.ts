import { Injectable } from '@angular/core';

import type { EncryptedBackupEnvelope } from './backup-schema';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ENVELOPE_VERSION = 1 as const;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

@Injectable({ providedIn: 'root' })
export class BackupCryptoService {
  async encrypt(plaintext: string, password: string): Promise<EncryptedBackupEnvelope> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await this.deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new TextEncoder().encode(plaintext),
    );

    return {
      v: ENVELOPE_VERSION,
      salt: bufferToBase64(salt.buffer),
      iv: bufferToBase64(iv.buffer),
      ciphertext: bufferToBase64(ciphertext),
    };
  }

  async decrypt(envelope: EncryptedBackupEnvelope, password: string): Promise<string> {
    const salt = new Uint8Array(base64ToBuffer(envelope.salt));
    const iv = new Uint8Array(base64ToBuffer(envelope.iv));
    const key = await this.deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      base64ToBuffer(envelope.ciphertext),
    );

    return new TextDecoder().decode(plaintext);
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const saltBuffer = new Uint8Array(salt);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }
}
