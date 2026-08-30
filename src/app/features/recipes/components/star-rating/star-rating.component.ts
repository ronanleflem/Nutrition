import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  template: `
    <div
      class="star-rating"
      role="group"
      [attr.aria-label]="readonly() ? 'Note ' + (value() ?? 0) + ' sur 5' : 'Attribuer une note'"
    >
      @for (star of stars; track star) {
        <button
          type="button"
          class="star-rating__star"
          [class.star-rating__star--active]="star <= (value() ?? 0)"
          [disabled]="readonly()"
          [attr.aria-label]="star + ' étoile' + (star > 1 ? 's' : '')"
          [attr.aria-pressed]="!readonly() && value() === star"
          (click)="onSelect(star)"
        >
          ★
        </button>
      }
    </div>
  `,
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  readonly value = input<number | undefined>();
  readonly readonly = input(false);

  readonly valueChange = output<number | null>();

  readonly stars = [1, 2, 3, 4, 5] as const;

  onSelect(star: number): void {
    if (this.readonly()) {
      return;
    }

    const current = this.value();
    this.valueChange.emit(current === star ? null : star);
  }
}
