import { Component, input, output } from '@angular/core';

import type { DailyMealMacroRow } from '../../../../core/models/daily-macro-synthesis';
import { formatRecipeMacros } from '../../../../core/models/recipe-macros';

@Component({
  selector: 'app-macro-synthesis-sheet',
  templateUrl: './macro-synthesis-sheet.component.html',
  styleUrl: './macro-synthesis-sheet.component.scss',
})
export class MacroSynthesisSheetComponent {
  readonly dateLabel = input.required<string>();
  readonly meals = input.required<DailyMealMacroRow[]>();
  readonly closed = output<void>();

  protected formatMealMacros(meal: DailyMealMacroRow): string {
    return formatRecipeMacros(meal.macros);
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }
}
