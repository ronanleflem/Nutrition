import { Component, ElementRef, input, output, viewChildren } from '@angular/core';

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

  private readonly chipButtons = viewChildren<ElementRef<HTMLButtonElement>>('chipButton');

  onSelect(variantId: string): void {
    if (variantId !== this.selectedVariantId()) {
      this.selectedVariantIdChange.emit(variantId);
    }
  }

  onChipKeydown(event: KeyboardEvent, index: number): void {
    const variants = this.variants();
    if (variants.length === 0) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = index < variants.length - 1 ? index + 1 : 0;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = index > 0 ? index - 1 : variants.length - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = variants.length - 1;
    }

    if (nextIndex == null) {
      return;
    }

    event.preventDefault();
    const nextVariant = variants[nextIndex];
    this.onSelect(nextVariant.id);
    this.chipButtons()[nextIndex]?.nativeElement.focus();
  }
}
