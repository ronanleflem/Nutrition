import { Component, computed, input } from '@angular/core';

import {
  PRODUCT_PRIORITY_LABELS,
  type ProductPriority,
} from '../../../../core/models/product';

@Component({
  selector: 'app-priority-badge',
  template: `
    @if (priority()) {
      <span
        class="priority-badge"
        [class]="badgeClass()"
        [attr.aria-label]="ariaLabel()"
        role="img"
      ></span>
    }
  `,
  styleUrl: './priority-badge.component.scss',
})
export class PriorityBadgeComponent {
  readonly priority = input<ProductPriority | undefined>();

  readonly ariaLabel = computed(() => {
    const value = this.priority();
    return value ? PRODUCT_PRIORITY_LABELS[value] : '';
  });

  readonly badgeClass = computed(() => {
    const value = this.priority();
    return value ? `priority-badge--${value}` : '';
  });
}
