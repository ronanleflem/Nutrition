import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { vi } from 'vitest';

@Component({
  selector: 'zxing-scanner',
  standalone: true,
  template: '',
})
class MockZxingScannerComponent {}

@NgModule({
  imports: [MockZxingScannerComponent],
  exports: [MockZxingScannerComponent],
})
class MockZxingScannerModule {}

vi.mock('@zxing/ngx-scanner', () => ({
  ZXingScannerModule: MockZxingScannerModule,
  ZXingScannerComponent: MockZxingScannerComponent,
}));
