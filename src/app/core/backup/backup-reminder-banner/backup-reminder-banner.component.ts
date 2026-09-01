import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-backup-reminder-banner',
  imports: [RouterLink],
  templateUrl: './backup-reminder-banner.component.html',
  styleUrl: './backup-reminder-banner.component.scss',
})
export class BackupReminderBannerComponent {
  readonly dismiss = output<void>();
}
