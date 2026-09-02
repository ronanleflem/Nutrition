import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { DatabaseService } from './core/database/database.service';
import { NotFoundPageComponent } from './core/layout/not-found/not-found-page.component';
import { ShellComponent } from './core/layout/shell/shell.component';

export async function resolveStartupPath(): Promise<string> {
  try {
    const database = inject(DatabaseService);
    const settings = await database.getAppSettings();
    if (settings.onboardingCompleted !== true) {
      const recipes = await database.listRecipes();
      if (recipes.length === 0) {
        return 'onboarding';
      }

      await database.updateOnboardingCompleted(true);
    }
    return settings.hideHomeOnStartup === true ? 'pantry' : 'home';
  } catch {
    return 'home';
  }
}

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: resolveStartupPath },
      {
        path: 'home',
        data: { title: 'Accueil' },
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'onboarding',
        data: { title: 'Bienvenue' },
        loadChildren: () =>
          import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
      },
      {
        path: 'pantry',
        data: { title: 'Garde-manger' },
        loadChildren: () =>
          import('./features/pantry/pantry.routes').then((m) => m.PANTRY_ROUTES),
      },
      {
        path: 'products',
        data: { title: 'Produits' },
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'recipes',
        data: { title: 'Recettes' },
        loadChildren: () =>
          import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES),
      },
      {
        path: 'plan',
        data: { title: 'Plan' },
        loadChildren: () =>
          import('./features/meal-plan/meal-plan.routes').then((m) => m.MEAL_PLAN_ROUTES),
      },
      {
        path: 'shopping',
        data: { title: 'Courses' },
        loadChildren: () =>
          import('./features/shopping-list/shopping-list.routes').then(
            (m) => m.SHOPPING_LIST_ROUTES,
          ),
      },
      {
        path: 'goals',
        data: { title: 'Objectifs' },
        loadChildren: () =>
          import('./features/macro-goals/macro-goals.routes').then((m) => m.MACRO_GOALS_ROUTES),
      },
      {
        path: 'settings',
        data: { title: 'Paramètres' },
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: '**',
        component: NotFoundPageComponent,
        data: { title: 'Page introuvable' },
      },
    ],
  },
];
