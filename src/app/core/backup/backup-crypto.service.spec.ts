import { TestBed } from '@angular/core/testing';

import { BackupCryptoService } from './backup-crypto.service';

describe('BackupCryptoService', () => {
  let service: BackupCryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackupCryptoService);
  });

  it('encrypts and decrypts a payload round-trip', async () => {
    const plaintext = JSON.stringify({ schemaVersion: 1, exportedAt: '2026-09-01T00:00:00.000Z' });
    const envelope = await service.encrypt(plaintext, 'secret-passphrase');

    expect(envelope.v).toBe(1);
    expect(envelope.salt).toBeTruthy();
    expect(envelope.iv).toBeTruthy();
    expect(envelope.ciphertext).toBeTruthy();

    const decrypted = await service.decrypt(envelope, 'secret-passphrase');
    expect(decrypted).toBe(plaintext);
  });

  it('fails decryption with wrong password', async () => {
    const envelope = await service.encrypt('{"ok":true}', 'correct-password');

    await expect(service.decrypt(envelope, 'wrong-password')).rejects.toThrow();
  });

  it('produces distinct envelopes for the same plaintext', async () => {
    const first = await service.encrypt('same', 'password');
    const second = await service.encrypt('same', 'password');

    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
  });
});
