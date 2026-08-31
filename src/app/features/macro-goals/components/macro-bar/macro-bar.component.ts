import { Component, input, output } from '@angular/core';

import type { MacroBarViewModel } from '../../../../core/models/daily-macro-synthesis';

@Component({
  selector: 'app-macro-bar',
  templateUrl: './macro-bar.component.html',
  styleUrl: './macro-bar.component.scss',
})
export class MacroBarComponent {
  readonly bar = input.required<MacroBarViewModel>();
  readonly tapped = output<MacroBarViewModel>();

  onBarTap(): void {
    this.tapped.emit(this.bar());
  }
}
