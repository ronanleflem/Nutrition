import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { STORE_LABELS } from '../../../../core/models/store';
import type { ProductReference } from '../../../../core/models/product-reference';
import { ScoreChipComponent } from '../score-chip/score-chip.component';

@Component({
  selector: 'app-reference-row',
  imports: [RouterLink, ScoreChipComponent],
  templateUrl: './reference-row.component.html',
  styleUrl: './reference-row.component.scss',
})
export class ReferenceRowComponent {
  readonly reference = input.required<ProductReference>();
  readonly productId = input.required<string>();
  readonly isPreferred = input(false);
  readonly productArchived = input(false);

  readonly setPreferred = output<string>();

  storeLabel(): string {
    return STORE_LABELS[this.reference().store];
  }

  macrosLine(): string {
    return formatMacrosSummary(this.reference());
  }

  onSetPreferred(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setPreferred.emit(this.reference().id);
  }
}
