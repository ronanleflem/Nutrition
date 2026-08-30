import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BOTTOM_NAV_ITEMS } from '../navigation/bottom-nav-items';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly items = BOTTOM_NAV_ITEMS;
}
