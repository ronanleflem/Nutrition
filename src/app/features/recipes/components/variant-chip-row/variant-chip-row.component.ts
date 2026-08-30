import { Component, input, output } from '@angular/core';

import type { RecipeVariantDetail } from '../../../../core/models/recipe-detail';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-variant-chip-row',
  imports: [StarRatingComponent],
  templateUrl: './variant-chip-row.component.html',
  styleUrl: './variant-chip-row.component.scss',
})
export class VariantChipRowComponent {
  readonly variants = input.required<RecipeVariantDetail[]>();
  readonly selectedVariantId = input.required<string>();
  readonly defaultVariantId = input.required<string>();

  readonly selectedVariantIdChange = output<string>();

  onSelect(variantId: string): void {
    if (variantId !== this.selectedVariantId()) {
      this.selectedVariantIdChange.emit(variantId);
    }
  }
}
