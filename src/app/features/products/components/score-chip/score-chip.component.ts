import { Component, input } from '@angular/core';

@Component({
  selector: 'app-score-chip',
  template: `<span class="score-chip">{{ score() }}</span>`,
  styleUrl: './score-chip.component.scss',
})
export class ScoreChipComponent {
  readonly score = input.required<number>();
}
