export type FoodCategoryKind =
  | 'legumes'
  | 'fruits'
  | 'viande'
  | 'poisson'
  | 'laitiers'
  | 'oeufs'
  | 'feculents'
  | 'legumineuses'
  | 'boissons'
  | 'sauces'
  | 'sucres'
  | 'autres';

export const FOOD_CATEGORY_KIND_LABELS: Record<FoodCategoryKind, string> = {
  legumes: 'Légumes',
  fruits: 'Fruits',
  viande: 'Viande',
  poisson: 'Poisson',
  laitiers: 'Produits laitiers',
  oeufs: 'Œufs',
  feculents: 'Féculents',
  legumineuses: 'Légumineuses',
  boissons: 'Boissons',
  sauces: 'Sauces et condiments',
  sucres: 'Sucreries',
  autres: 'Autre',
};
