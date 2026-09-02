import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContextShortcutsOutletComponent } from './context-shortcuts-outlet.component';
import { ContextShortcutsService } from './context-shortcuts.service';

describe('ContextShortcutsOutletComponent', () => {
  let fixture: ComponentFixture<ContextShortcutsOutletComponent>;
  let shortcuts: ContextShortcutsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextShortcutsOutletComponent],
    }).compileComponents();

    shortcuts = TestBed.inject(ContextShortcutsService);
    fixture = TestBed.createComponent(ContextShortcutsOutletComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    shortcuts.reset();
  });

  it('clears leftover sheet state when destroyed', () => {
    shortcuts.openMenu({ kind: 'product', productId: 'p1', productName: 'Skyr' });
    fixture.detectChanges();
    expect(shortcuts.sheet()?.name).toBe('menu');

    fixture.destroy();

    expect(shortcuts.sheet()).toBeNull();
    expect(shortcuts.actionError()).toBeNull();
    expect(shortcuts.confirmation()).toBeNull();
  });
});
