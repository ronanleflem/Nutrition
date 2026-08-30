import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

function getPageTitle(route: ActivatedRoute): string {
  let current: ActivatedRoute | null = route;
  let title = 'Nutrition';

  while (current) {
    const routeTitle = current.snapshot?.data['title'];
    if (typeof routeTitle === 'string') {
      title = routeTitle;
    }
    current = current.firstChild;
  }

  return title;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, BottomNavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => getPageTitle(this.route)),
    ),
    { initialValue: getPageTitle(this.route) },
  );
}
