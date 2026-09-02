import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LONG_PRESS_DURATION_MS } from './context-shortcuts.models';
import { LongPressDirective } from './long-press.directive';

@Component({
  standalone: true,
  imports: [LongPressDirective],
  template: `<article appLongPress (appLongPress)="fired = true"><a href="/detail">Titre</a></article>`,
})
class HostComponent {
  fired = false;
}

describe('LongPressDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    host = fixture.nativeElement.querySelector('article') as HTMLElement;
  });

  function pointer(type: string, x = 10, y = 10): void {
    host.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  }

  it('emits after a 500 ms hold without movement', async () => {
    pointer('pointerdown');
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS - 50));
    expect(fixture.componentInstance.fired).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(fixture.componentInstance.fired).toBe(true);
  });

  it('does not emit when the press is shorter than 500 ms', async () => {
    pointer('pointerdown');
    await new Promise((resolve) => setTimeout(resolve, 400));
    pointer('pointerup');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(fixture.componentInstance.fired).toBe(false);
  });

  it('does not emit when the pointer moves while holding', async () => {
    pointer('pointerdown', 10, 10);
    pointer('pointermove', 40, 10);
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS + 30));
    expect(fixture.componentInstance.fired).toBe(false);
  });

  it('prevents the following click after a long-press', async () => {
    pointer('pointerdown');
    await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_DURATION_MS + 30));
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });
});
