import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly title = input('Confirmer');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly dismissLabel = input<string | undefined>(undefined);
  readonly confirmDisabled = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();

  onBackdropClick(): void {
    if (this.dismissLabel()) {
      this.dismissed.emit();
      return;
    }

    this.cancelled.emit();
  }
}
