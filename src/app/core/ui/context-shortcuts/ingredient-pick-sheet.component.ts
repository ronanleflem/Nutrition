import { Component, input, output } from '@angular/core';

import type { ShortcutIngredientOption } from './context-shortcuts.models';

@Component({
  selector: 'app-ingredient-pick-sheet',
  templateUrl: './ingredient-pick-sheet.component.html',
  styleUrl: './context-shortcuts-sheet.scss',
})
export class IngredientPickSheetComponent {
  readonly ingredients = input.required<ShortcutIngredientOption[]>();
  readonly closed = output<void>();
  readonly selected = output<ShortcutIngredientOption>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }
}
