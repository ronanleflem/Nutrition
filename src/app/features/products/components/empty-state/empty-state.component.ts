import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateIllustrationComponent } from './empty-state-illustration.component';
import { EMPTY_STATE_PRESETS } from './empty-state.presets';
import type { EmptyStateVariant } from './empty-state.types';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, EmptyStateIllustrationComponent],
  template: `
    <div class="empty-state" role="status">
      @if (showIllustration()) {
        <app-empty-state-illustration [variant]="resolvedVariant()" />
      }

      <h2 class="empty-state__title">{{ displayTitle() }}</h2>
      <p class="empty-state__message">{{ displayMessage() }}</p>

      @if (showCta() || showSecondaryCta()) {
        <div class="empty-state__actions">
          @if (showCta()) {
            @if (ctaAsButton()) {
              <button type="button" class="empty-state__cta" (click)="ctaClicked.emit()">
                {{ displayCtaLabel() }}
              </button>
            } @else {
              <a class="empty-state__cta" [routerLink]="displayCtaLink()">{{ displayCtaLabel() }}</a>
            }
          }

          @if (showSecondaryCta()) {
            <a class="empty-state__cta empty-state__cta--secondary" [routerLink]="displaySecondaryCtaLink()">
              {{ displaySecondaryCtaLabel() }}
            </a>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly variant = input<EmptyStateVariant>('products');
  readonly title = input<string | undefined>();
  readonly message = input<string | undefined>();
  readonly showIllustration = input(true);
  readonly showCta = input(true);
  readonly ctaAsButton = input(false);
  readonly ctaLabel = input<string | undefined>();
  readonly ctaLink = input<string | undefined>();
  readonly secondaryCtaLabel = input<string | undefined>();
  readonly secondaryCtaLink = input<string | undefined>();
  readonly secondaryCta = input<boolean | undefined>(undefined);

  readonly ctaClicked = output<void>();

  readonly resolvedVariant = computed(() => this.variant());

  private readonly preset = computed(() => EMPTY_STATE_PRESETS[this.variant()]);

  readonly displayTitle = computed(() => this.title() ?? this.preset().title);
  readonly displayMessage = computed(() => this.message() ?? this.preset().message);
  readonly displayCtaLabel = computed(() => this.ctaLabel() ?? this.preset().ctaLabel);
  readonly displayCtaLink = computed(() => this.ctaLink() ?? this.preset().ctaLink);
  readonly displaySecondaryCtaLabel = computed(
    () => this.secondaryCtaLabel() ?? this.preset().secondaryCtaLabel,
  );
  readonly displaySecondaryCtaLink = computed(
    () => this.secondaryCtaLink() ?? this.preset().secondaryCtaLink,
  );

  readonly showSecondaryCta = computed(() => {
    const explicit = this.secondaryCta();
    if (explicit !== undefined) {
      return explicit;
    }

    return Boolean(this.displaySecondaryCtaLabel() && this.displaySecondaryCtaLink());
  });
}
