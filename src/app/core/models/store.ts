export type Store =
  | 'carrefour'
  | 'auchan'
  | 'intermarche'
  | 'leclerc'
  | 'lidl'
  | 'grandfrais'
  | 'internet'
  | 'other';

export const STORES: Store[] = [
  'carrefour',
  'auchan',
  'intermarche',
  'leclerc',
  'lidl',
  'grandfrais',
  'internet',
  'other',
];

export const STORE_LABELS: Record<Store, string> = {
  carrefour: 'Carrefour',
  auchan: 'Auchan',
  intermarche: 'Intermarché',
  leclerc: 'Leclerc',
  lidl: 'Lidl',
  grandfrais: 'Grand Frais',
  internet: 'Internet',
  other: 'Autre',
};
