import { Component, input, output } from '@angular/core';

import {
  CONTEXT_MENU_ACTIONS,
  LONG_PRESS_BACKDROP_IGNORE_MS,
  type ContextMenuAction,
  type ShortcutTarget,
} from './context-shortcuts.models';

@Component({
  selector: 'app-context-action-menu',
  templateUrl: './context-action-menu.component.html',
  styleUrl: './context-shortcuts-sheet.scss',
})
export class ContextActionMenuComponent {
  readonly target = input.required<ShortcutTarget>();
  readonly busy = input(false);
  readonly ignoreBackdrop = input(false);
  readonly closed = output<void>();
  readonly action = output<ContextMenuAction>();

  readonly labels = CONTEXT_MENU_ACTIONS;
  private readonly openedAt = Date.now();

  title(): string {
    const target = this.target();
    return target.kind === 'product' ? target.productName : target.recipeTitle;
  }

  showUseInRecipe(): boolean {
    return this.target().kind === 'product';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] !== 'true') {
      return;
    }

    if (this.ignoreBackdrop() && Date.now() - this.openedAt < LONG_PRESS_BACKDROP_IGNORE_MS) {
      return;
    }

    this.closed.emit();
  }

  choose(action: ContextMenuAction): void {
    if (this.busy()) {
      return;
    }

    this.action.emit(action);
  }
}
