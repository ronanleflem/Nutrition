import { Component, input, output } from '@angular/core';

import type { MacroBarViewModel } from '../../../../core/models/daily-macro-synthesis';
import { MacroBarComponent } from '../macro-bar/macro-bar.component';

@Component({
  selector: 'app-macro-bar-group',
  imports: [MacroBarComponent],
  templateUrl: './macro-bar-group.component.html',
  styleUrl: './macro-bar-group.component.scss',
})
export class MacroBarGroupComponent {
  readonly bars = input.required<MacroBarViewModel[]>();
  readonly barTapped = output<MacroBarViewModel>();
}
