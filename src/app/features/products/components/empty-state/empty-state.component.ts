import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="empty-state">
      <p class="empty-state__message">Aucun produit dans votre catalogue.</p>
      <a class="empty-state__cta" routerLink="/products/new">Ajouter un produit</a>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {}
