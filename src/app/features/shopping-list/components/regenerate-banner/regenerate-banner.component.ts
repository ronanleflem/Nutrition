import { Component, output } from '@angular/core';

@Component({
  selector: 'app-regenerate-banner',
  templateUrl: './regenerate-banner.component.html',
  styleUrl: './regenerate-banner.component.scss',
})
export class RegenerateBannerComponent {
  readonly regenerate = output<void>();
}
