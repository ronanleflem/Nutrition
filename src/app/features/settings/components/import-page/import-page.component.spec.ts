import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { BackupService } from '../../../../core/backup/backup.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';
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

  it('shows an ephemeral toast with photo restore summary after import', async () => {
    const toast = TestBed.inject(ToastService);
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(backupService, 'importFromFile').mockResolvedValue({
      mode: 'merge',
      products: 1,
      productReferences: 0,
      pantryItems: 0,
      recipes: 0,
      recipeVariants: 0,
      mealPlanEntries: 0,
      shoppingListItems: 0,
      photosRestored: 2,
      photosMissing: 1,
    });

    fixture.componentInstance.selectedFile.set(
      new File(['{}'], 'backup.nutrition-backup.json', { type: 'application/json' }),
    );
    fixture.componentInstance.form.controls.mode.setValue('merge');
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();

    expect(showSpy).toHaveBeenCalledWith('Import terminé — 2 photos restaurées, 1 manquantes');
  });
});
