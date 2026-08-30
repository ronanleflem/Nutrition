import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="empty-state">
      <p class="empty-state__message">{{ message() }}</p>
      @if (showCta()) {
        <a class="empty-state__cta" routerLink="/products/new">{{ ctaLabel() }}</a>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly message = input('Aucun produit dans votre catalogue.');
  readonly showCta = input(true);
  readonly ctaLabel = input('Ajouter un produit');
}
