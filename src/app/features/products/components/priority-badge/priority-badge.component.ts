import { Component, computed, input } from '@angular/core';

import {
  PRODUCT_PRIORITY_LABELS,
  PRODUCT_PRIORITY_VISIBLE_LABELS,
  type ProductPriority,
} from '../../../../core/models/product';

@Component({
  selector: 'app-priority-badge',
  template: `
    @if (priority()) {
      <span class="priority-badge" [class]="badgeClass()">
        <span class="priority-badge__dot" aria-hidden="true"></span>
        <span class="priority-badge__label">{{ visibleLabel() }}</span>
        <span class="priority-badge__sr-only">{{ ariaLabel() }}</span>
      </span>
    }
  `,
  styleUrl: './priority-badge.component.scss',
})
export class PriorityBadgeComponent {
  readonly priority = input<ProductPriority | undefined>();

  readonly visibleLabel = computed(() => {
    const value = this.priority();
    return value ? PRODUCT_PRIORITY_VISIBLE_LABELS[value] : '';
  });

  readonly ariaLabel = computed(() => {
    const value = this.priority();
    return value ? PRODUCT_PRIORITY_LABELS[value] : '';
  });

  readonly badgeClass = computed(() => {
    const value = this.priority();
    return value ? `priority-badge--${value}` : '';
  });
}
