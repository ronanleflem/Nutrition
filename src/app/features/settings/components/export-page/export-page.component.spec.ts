import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BackupService } from '../../../../core/backup/backup.service';
import { ExportPageComponent } from './export-page.component';

describe('ExportPageComponent', () => {
  let fixture: ComponentFixture<ExportPageComponent>;
  let backupService: BackupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    backupService = TestBed.inject(BackupService);
    fixture = TestBed.createComponent(ExportPageComponent);
    fixture.detectChanges();
  });

  it('blocks export when encrypted passwords mismatch', () => {
    fixture.componentInstance.form.patchValue({
      encrypt: true,
      password: 'alpha',
      confirmPassword: 'beta',
    });
    fixture.componentInstance.form.markAllAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.passwordMismatch).toBe(true);
    expect(fixture.componentInstance.canExport).toBe(false);
  });

  it('blocks export when encrypted password is empty', () => {
    fixture.componentInstance.form.patchValue({
      encrypt: true,
      password: '',
      confirmPassword: '',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.canExport).toBe(false);
  });

  it('shows plain export warning before unencrypted download', async () => {
    const exportSpy = vi.spyOn(backupService, 'exportToFile').mockResolvedValue(undefined);

    fixture.componentInstance.form.patchValue({ encrypt: false });
    fixture.detectChanges();

    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(exportSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.showPlainWarning()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('lisible en clair');
  });

  it('exports after confirming plain export warning', async () => {
    const exportSpy = vi.spyOn(backupService, 'exportToFile').mockResolvedValue(undefined);

    fixture.componentInstance.form.patchValue({ encrypt: false });
    fixture.detectChanges();

    await fixture.componentInstance.confirmPlainExport();

    expect(exportSpy).toHaveBeenCalledWith({ encrypt: false, password: undefined });
  });
});
