import { Directive, HostListener, input, output } from '@angular/core';

import { LONG_PRESS_DURATION_MS, LONG_PRESS_MOVE_THRESHOLD_PX } from './context-shortcuts.models';

@Directive({
  selector: '[appLongPress]',
})
export class LongPressDirective {
  readonly longPressMs = input(LONG_PRESS_DURATION_MS);
  readonly appLongPress = output<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private startX = 0;
  private startY = 0;
  private fired = false;

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    this.clearTimer();
    this.fired = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.timer = setTimeout(() => {
      this.fired = true;
      this.timer = null;
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
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.fired) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.fired = false;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event): void {
    event.preventDefault();
  }

  private clearTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
