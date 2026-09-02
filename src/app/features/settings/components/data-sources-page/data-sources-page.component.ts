import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FOOD_LIBRARY_ATTRIBUTIONS } from '../../../../core/food-library/food-library-attribution';

@Component({
  selector: 'app-data-sources-page',
  imports: [RouterLink],
  templateUrl: './data-sources-page.component.html',
  styleUrl: './data-sources-page.component.scss',
})
export class DataSourcesPageComponent {
  readonly sources = FOOD_LIBRARY_ATTRIBUTIONS;
}
