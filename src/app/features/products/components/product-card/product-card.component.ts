import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Product } from '../../../../core/models/product';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

@Component({
  selector: 'app-product-card',
  imports: [PriorityBadgeComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
}
