export interface BottomNavItem {
  path: string;
  label: string;
  icon: 'pantry' | 'products' | 'recipes' | 'plan' | 'shopping';
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { path: '/pantry', label: 'Garde-manger', icon: 'pantry' },
  { path: '/products', label: 'Produits', icon: 'products' },
  { path: '/recipes', label: 'Recettes', icon: 'recipes' },
  { path: '/plan', label: 'Plan', icon: 'plan' },
  { path: '/shopping', label: 'Courses', icon: 'shopping' },
];
