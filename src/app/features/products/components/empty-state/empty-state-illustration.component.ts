import { Component, input } from '@angular/core';

import type { EmptyStateVariant } from './empty-state.types';

@Component({
  selector: 'app-empty-state-illustration',
  template: `
    @switch (variant()) {
      @case ('products') {
        <svg class="empty-state-illustration" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
          <path
            d="M16 52h48l-6 18H22l-6-18Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path
            d="M24 52V34c0-6 5-11 16-11s16 5 16 11v18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M40 18c-2-6-8-8-12-6M40 18c2-6 8-8 12-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      }
      @case ('recipes') {
        <svg class="empty-state-illustration" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
          <path
            d="M22 18h36v44H22V18Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M30 28h20M30 38h14M30 48h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path
            d="M52 14c3 4 3 10 0 14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      }
      @case ('pantry') {
        <svg class="empty-state-illustration" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
          <path
            d="M18 24h44v42H18V24Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M18 34h44M30 34v32M50 34v32" stroke="currentColor" stroke-width="2" />
          <circle cx="40" cy="16" r="4" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      }
      @case ('meal-plan') {
        <svg class="empty-state-illustration" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
          <rect
            x="18"
            y="20"
            width="44"
            height="40"
            rx="4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
          <path d="M18 32h44M30 20v-6M50 20v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="32" cy="44" r="3" fill="currentColor" />
          <circle cx="48" cy="50" r="3" fill="currentColor" />
        </svg>
      }
      @case ('shopping-list') {
        <svg class="empty-state-illustration" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
          <path
            d="M24 22h32l-4 34H28L24 22Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M30 22l3-8h14l3 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M32 36h16M32 46h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      }
    }
  `,
  styleUrl: './empty-state-illustration.component.scss',
})
export class EmptyStateIllustrationComponent {
  readonly variant = input.required<EmptyStateVariant>();
}
