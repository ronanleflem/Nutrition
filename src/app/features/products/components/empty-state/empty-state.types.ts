export type EmptyStateVariant =
  | 'products'
  | 'recipes'
  | 'pantry'
  | 'meal-plan'
  | 'shopping-list';

export interface EmptyStatePreset {
  title: string;
  message: string;
  ctaLabel: string;
  ctaLink: string;
  secondaryCtaLabel?: string;
  secondaryCtaLink?: string;
}
