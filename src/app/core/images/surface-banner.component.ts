import { Component, input } from '@angular/core';

import type { SurfaceBannerVariant } from './surface-banner.types';

@Component({
  selector: 'app-surface-banner',
  templateUrl: './surface-banner.component.html',
  styleUrl: './surface-banner.component.scss',
})
export class SurfaceBannerComponent {
  readonly variant = input.required<SurfaceBannerVariant>();
}
