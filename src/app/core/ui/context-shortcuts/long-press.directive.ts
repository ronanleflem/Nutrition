import { Directive, HostListener, input, OnDestroy, output } from '@angular/core';

import { LONG_PRESS_DURATION_MS, LONG_PRESS_MOVE_THRESHOLD_PX } from './context-shortcuts.models';

const CLICK_SUPPRESS_MS = 400;

@Directive({
  selector: '[appLongPress]',
})
export class LongPressDirective implements OnDestroy {
  readonly longPressMs = input(LONG_PRESS_DURATION_MS);
  readonly appLongPress = output<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private startX = 0;
  private startY = 0;
  private suppressClickUntil = 0;
  private didFire = false;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    this.clearTimer();
    this.didFire = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.didFire = true;
      this.suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
      this.appLongPress.emit();
    }, this.longPressMs());
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.timer == null) {
      return;
    }

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_PX * LONG_PRESS_MOVE_THRESHOLD_PX) {
      this.clearTimer();
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('pointerleave')
  onPointerEnd(): void {
    this.clearTimer();
    if (this.didFire) {
      this.suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (Date.now() > this.suppressClickUntil) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event): void {
    event.preventDefault();
    this.clearTimer();
    this.didFire = true;
    this.suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
    this.appLongPress.emit();
  }

  private clearTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
