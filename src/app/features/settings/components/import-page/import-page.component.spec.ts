import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { BackupService } from '../../../../core/backup/backup.service';
import { ImportPageComponent } from './import-page.component';

describe('ImportPageComponent', () => {
  let fixture: ComponentFixture<ImportPageComponent>;
  let backupService: BackupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    backupService = TestBed.inject(BackupService);
    fixture = TestBed.createComponent(ImportPageComponent);
    fixture.detectChanges();
  });

  it('requires password for encrypted files by extension', async () => {
    await fixture.componentInstance.onFileSelected({
      target: {
        files: [new File(['{}'], 'backup.nutrition-backup.enc', { type: 'application/json' })],
      },
    } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.componentInstance.requiresPassword).toBe(true);
    expect(fixture.componentInstance.canImport).toBe(false);
  });

  it('requires password for encrypted content even with .json extension', async () => {
    const encryptedContent = JSON.stringify({
      v: 1,
      salt: 'abc',
      iv: 'def',
      ciphertext: 'ghi',
    });

    await fixture.componentInstance.onFileSelected({
      target: {
        files: [new File([encryptedContent], 'backup.nutrition-backup.json', { type: 'application/json' })],
      },
    } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.componentInstance.requiresPassword).toBe(true);
    expect(fixture.componentInstance.canImport).toBe(false);
  });

  it('shows replace warning before destructive import', async () => {
    const importSpy = vi.spyOn(backupService, 'importFromFile').mockResolvedValue({
      mode: 'replace',
      products: 1,
      productReferences: 0,
      pantryItems: 0,
      recipes: 0,
      recipeVariants: 0,
      mealPlanEntries: 0,
      shoppingListItems: 0,
    });

    fixture.componentInstance.selectedFile.set(
      new File(['{}'], 'backup.nutrition-backup.json', { type: 'application/json' }),
    );
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(importSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.showReplaceWarning()).toBe(true);
  });
});
