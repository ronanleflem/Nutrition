import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ScanService } from '../../services/scan.service';
import { ScannerPageComponent } from './scanner-page.component';

describe('ScannerPageComponent', () => {
  let fixture: ComponentFixture<ScannerPageComponent>;
  let scanService: ScanService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    scanService = TestBed.inject(ScanService);
    fixture = TestBed.createComponent(ScannerPageComponent);
  });

  it('shows manual entry prominently on iOS without camera', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    );

    fixture = TestBed.createComponent(ScannerPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Saisir le code');
    expect(fixture.nativeElement.querySelector('zxing-scanner')).toBeNull();
  });

  it('submits manual barcode through ScanService', async () => {
    const resolveSpy = vi.spyOn(scanService, 'resolveBarcode').mockResolvedValue();

    fixture.detectChanges();
    fixture.componentInstance.manualBarcode.set('3017620422003');
    fixture.detectChanges();

    await fixture.componentInstance.submitManualBarcode();

    expect(resolveSpy).toHaveBeenCalledWith('3017620422003');
  });
});
