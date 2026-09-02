import { Component, input, output } from '@angular/core';

import {
  CONTEXT_MENU_ACTIONS,
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
  readonly closed = output<void>();
  readonly action = output<ContextMenuAction>();

  readonly labels = CONTEXT_MENU_ACTIONS;

  title(): string {
    const target = this.target();
    return target.kind === 'product' ? target.productName : target.recipeTitle;
  }

  showUseInRecipe(): boolean {
    return this.target().kind === 'product';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  choose(action: ContextMenuAction): void {
    this.action.emit(action);
  }
}
