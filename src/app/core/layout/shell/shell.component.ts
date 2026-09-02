import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { BackupReminderBannerComponent } from '../../backup/backup-reminder-banner/backup-reminder-banner.component';
import { BackupReminderService } from '../../backup/backup-reminder.service';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ShellChromeService } from '../shell-chrome.service';
import { NetworkStatusService } from '../../network/network-status.service';

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
  imports: [RouterOutlet, RouterLink, BottomNavComponent, BackupReminderBannerComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly networkStatus = inject(NetworkStatusService);
  protected readonly shellChrome = inject(ShellChromeService);
  protected readonly backupReminder = inject(BackupReminderService);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => getPageTitle(this.route)),
    ),
    { initialValue: getPageTitle(this.route) },
  );

  readonly isHome = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.isHomeUrl(this.router.url)),
    ),
    { initialValue: this.isHomeUrl(this.router.url) },
  );

  private isHomeUrl(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/home';
  }

  dismissBackupReminder(): void {
    void this.backupReminder.dismiss();
  }
}
