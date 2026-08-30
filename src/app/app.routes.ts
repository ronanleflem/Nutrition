import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pantry' },
  {
    path: 'pantry',
    loadChildren: () =>
      import('./features/pantry/pantry.routes').then((m) => m.PANTRY_ROUTES),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
  },
  {
    path: 'recipes',
    loadChildren: () =>
      import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES),
  },
  {
    path: 'plan',
    loadChildren: () =>
      import('./features/meal-plan/meal-plan.routes').then((m) => m.MEAL_PLAN_ROUTES),
  },
  {
    path: 'shopping',
    loadChildren: () =>
      import('./features/shopping-list/shopping-list.routes').then(
        (m) => m.SHOPPING_LIST_ROUTES,
      ),
  },
  {
    path: 'goals',
    loadChildren: () =>
      import('./features/macro-goals/macro-goals.routes').then((m) => m.MACRO_GOALS_ROUTES),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
  },
  { path: '**', redirectTo: 'pantry' },
];
