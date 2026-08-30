import { Routes } from '@angular/router';

import { RecipeDetailPageComponent } from './components/recipe-detail-page/recipe-detail-page.component';
import { RecipeFormPageComponent } from './components/recipe-form-page/recipe-form-page.component';
import { RecipeVariantFormPageComponent } from './components/recipe-variant-form-page/recipe-variant-form-page.component';
import { RecipesPageComponent } from './recipes-page.component';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipesPageComponent },
  { path: 'new', component: RecipeFormPageComponent, data: { title: 'Nouvelle recette' } },
  {
    path: ':id/variants/new',
    component: RecipeVariantFormPageComponent,
    data: { title: 'Nouvelle variante' },
  },
  { path: ':id', component: RecipeDetailPageComponent, data: { title: 'Détail recette' } },
];
