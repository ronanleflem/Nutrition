import { Component, computed, input } from '@angular/core';

import type { FoodCategoryKind } from '../../food-category/food-category.types';
import { resolveFoodCategory } from '../../food-category/resolve-food-category';

@Component({
  selector: 'app-food-category-icon',
  template: `
    @switch (kind()) {
      @case ('legumes') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 21c-4-3-7-7-7-11a7 7 0 0 1 14 0c0 4-3 8-7 11Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path d="M12 10V4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      }
      @case ('fruits') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path d="M12 8V5M12 5c1-2 3-2 4-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      }
      @case ('viande') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M6 14c0-4 2.5-8 6-8s6 4 6 8-2.5 6-6 6-6-2-6-6Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <circle cx="10" cy="13" r="1" fill="currentColor" />
          <circle cx="14" cy="15" r="1" fill="currentColor" />
        </svg>
      }
      @case ('poisson') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M4 12c3-4 7-6 12-6 2 0 4 .5 4 2s-2 2-4 2H8l4 4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle cx="17" cy="9" r="1" fill="currentColor" />
        </svg>
      }
      @case ('laitiers') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M9 4h6l1 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l1-3Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path d="M9 9h6" stroke="currentColor" stroke-width="1.6" />
        </svg>
      }
      @case ('oeufs') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 4c3 0 5 4.5 5 8s-2 8-5 8-5-4-5-8 2-8 5-8Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
        </svg>
      }
      @case ('feculents') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      }
      @case ('legumineuses') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M8 6c0 6 2 10 4 12 2-2 4-6 4-12M8 6h8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          <circle cx="10" cy="11" r="1" fill="currentColor" />
          <circle cx="14" cy="13" r="1" fill="currentColor" />
        </svg>
      }
      @case ('boissons') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M8 5h8l-1 14H9L8 5ZM10 9h4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
      }
      @case ('sauces') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M10 4h4v3l4 11a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2l4-11V4Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
      }
      @case ('sucres') {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M7 14h10l-2 6H9l-2-6ZM12 4l2 6H10l2-6Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
      }
      @default {
        <svg class="food-category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      }
    }
  `,
  styleUrl: './food-category-icon.component.scss',
})
export class FoodCategoryIconComponent {
  readonly kind = input.required<FoodCategoryKind>();
}

@Component({
  selector: 'app-food-category-label',
  imports: [FoodCategoryIconComponent],
  template: `
    @if (resolvedKind(); as kind) {
      <span class="food-category-label">
        <app-food-category-icon [kind]="kind" />
        <span class="food-category-label__text">{{ displayLabel() }}</span>
      </span>
    }
  `,
  styleUrl: './food-category-label.component.scss',
})
export class FoodCategoryLabelComponent {
  readonly category = input<string | undefined>();

  readonly resolvedKind = computed(() => resolveFoodCategory(this.category()));

  readonly displayLabel = computed(() => this.category()?.trim() ?? '');
}
