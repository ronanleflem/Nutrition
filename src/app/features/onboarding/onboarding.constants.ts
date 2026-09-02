export const OMELETTE_TITLE = 'Omelette';
export const OMELETTE_VARIANT_NAME = 'Base';

export const OMELETTE_CIQUAL_IDS = ['ciqual-22000', 'ciqual-16400', 'ciqual-11058'] as const;

export const OMELETTE_INGREDIENTS: ReadonlyArray<{ sourceId: string; quantityG: number }> = [
  { sourceId: 'ciqual-22000', quantityG: 120 },
  { sourceId: 'ciqual-16400', quantityG: 10 },
  { sourceId: 'ciqual-11058', quantityG: 1 },
];

export const OMELETTE_STEPS = [
  'Battre les œufs.',
  'Cuire à la poêle avec le beurre.',
  'Saler.',
];
