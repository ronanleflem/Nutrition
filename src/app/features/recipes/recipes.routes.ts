import { Routes } from '@angular/router';

import { RecipeFormPageComponent } from './components/recipe-form-page/recipe-form-page.component';
import { RecipesPageComponent } from './recipes-page.component';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipesPageComponent },
  { path: 'new', component: RecipeFormPageComponent, data: { title: 'Nouvelle recette' } },
];
