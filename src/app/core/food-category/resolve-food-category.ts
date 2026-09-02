import { normalizeFoodSearchText } from '../food-library/normalize-food-search';
import type { FoodCategoryKind } from './food-category.types';

const EXACT_CODES: Record<string, FoodCategoryKind> = {
  legume: 'legumes',
  legumes: 'legumes',
  fruit: 'fruits',
  fruits: 'fruits',
  viande: 'viande',
  poisson: 'poisson',
  laitier: 'laitiers',
  laitiers: 'laitiers',
  oeuf: 'oeufs',
  oeufs: 'oeufs',
  feculent: 'feculents',
  feculents: 'feculents',
  legumineuse: 'legumineuses',
  legumineuses: 'legumineuses',
  boisson: 'boissons',
  boissons: 'boissons',
  sauce: 'sauces',
  sauces: 'sauces',
  sucre: 'sucres',
  sucres: 'sucres',
};

const CATEGORY_RULES: ReadonlyArray<{ kind: FoodCategoryKind; patterns: RegExp[] }> = [
  { kind: 'oeufs', patterns: [/oeuf/] },
  { kind: 'laitiers', patterns: [/laitier/, /fromage/, /yaourt/, /yogourt/, /skyr/, /creme/, /beurre/] },
  { kind: 'viande', patterns: [/viande/, /volaille/, /abat/, /charcut/, /boeuf/, /porc/, /agneau/, /veau/] },
  { kind: 'poisson', patterns: [/poisson/, /crustac/, /fruit de mer/, /fruits de mer/] },
  { kind: 'legumes', patterns: [/legume/, /salade/, /champignon/, /tomate/, /carotte/] },
  { kind: 'fruits', patterns: [/fruit/, /baie/] },
  { kind: 'feculents', patterns: [/feculent/, /cereal/, /riz/, /pate/, /pain/, /pomme de terre/, /fecule/] },
  { kind: 'legumineuses', patterns: [/legumineuse/, /lentille/, /pois chiche/, /haricot sec/] },
  { kind: 'boissons', patterns: [/boisson/, /\beau\b/, /jus /, /soda/, /cafe/, /the /] },
  { kind: 'sauces', patterns: [/sauce/, /condiment/, /epice/, /vinaigre/, /huile d/] },
  { kind: 'sucres', patterns: [/sucre/, /dessert/, /confiser/, /chocolat/, /biscuit/, /gateau/] },
];

export function resolveFoodCategory(category?: string | null): FoodCategoryKind | null {
  const trimmed = category?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeFoodSearchText(trimmed);
  const exact = EXACT_CODES[normalized];
  if (exact) {
    return exact;
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.kind;
    }
  }

  return null;
}
