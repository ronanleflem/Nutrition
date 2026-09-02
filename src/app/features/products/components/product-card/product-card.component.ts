import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ProductCatalogItem } from '../../../../core/models/product-catalog';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { STORE_LABELS } from '../../../../core/models/store';
import { LongPressDirective } from '../../../../core/ui/context-shortcuts/long-press.directive';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { ScoreChipComponent } from '../score-chip/score-chip.component';
import { FoodCategoryLabelComponent } from '../../../../core/ui/food-category-label/food-category-label.component';

@Component({
  selector: 'app-product-card',
  imports: [
    PriorityBadgeComponent,
    ScoreChipComponent,
    RouterLink,
    FoodCategoryLabelComponent,
    LongPressDirective,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly item = input.required<ProductCatalogItem>();
  readonly shortcut = output<void>();

  onMenuClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.shortcut.emit();
  }

  storeLine(): string | null {
    const preferred = this.item().preferredReference;
    const store = preferred ? STORE_LABELS[preferred.store] : undefined;
    return store ?? null;
  }

  macrosLine(): string | null {
    const preferred = this.item().preferredReference;
    return preferred ? formatMacrosSummary(preferred) : null;
  }
}
