import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ProductCatalogItem } from '../../../../core/models/product-catalog';
import { formatMacrosSummary } from '../../../../core/models/product-reference';
import { STORE_LABELS } from '../../../../core/models/store';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { ScoreChipComponent } from '../score-chip/score-chip.component';

@Component({
  selector: 'app-product-card',
  imports: [PriorityBadgeComponent, ScoreChipComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly item = input.required<ProductCatalogItem>();

  storeLine(): string {
    const product = this.item().product;
    const preferred = this.item().preferredReference;
    const store = preferred ? STORE_LABELS[preferred.store] : undefined;
    const parts = [store, product.category].filter(Boolean);
    return parts.join(' · ');
  }

  macrosLine(): string | null {
    const preferred = this.item().preferredReference;
    return preferred ? formatMacrosSummary(preferred) : null;
  }
}
