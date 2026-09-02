import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ProductCatalogItem } from '../../../../core/models/product-catalog';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { STORE_LABELS } from '../../../../core/models/store';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { ScoreChipComponent } from '../score-chip/score-chip.component';
import { FoodCategoryLabelComponent } from '../../../../core/ui/food-category-label/food-category-label.component';

@Component({
  selector: 'app-product-card',
  imports: [PriorityBadgeComponent, ScoreChipComponent, RouterLink, FoodCategoryLabelComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly item = input.required<ProductCatalogItem>();

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
