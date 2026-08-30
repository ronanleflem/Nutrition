import { Component, computed, input } from '@angular/core';

import { formatRecipeMacros, type RecipeMacroBreakdown } from '../../../../core/models/recipe-macros';

@Component({
  selector: 'app-recipe-macros-panel',
  templateUrl: './recipe-macros-panel.component.html',
  styleUrl: './recipe-macros-panel.component.scss',
})
export class RecipeMacrosPanelComponent {
  readonly breakdown = input.required<RecipeMacroBreakdown>();
  readonly portions = input.required<number>();

  readonly totalLine = computed(() => formatRecipeMacros(this.breakdown().total));
  readonly perPortionLine = computed(() => formatRecipeMacros(this.breakdown().perPortion));
}
