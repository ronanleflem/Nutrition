import { Routes } from '@angular/router';

import { RecipeDetailPageComponent } from './components/recipe-detail-page/recipe-detail-page.component';
import { RecipeEditPageComponent } from './components/recipe-edit-page/recipe-edit-page.component';
import { RecipeFormPageComponent } from './components/recipe-form-page/recipe-form-page.component';
import { RecipeVariantFormPageComponent } from './components/recipe-variant-form-page/recipe-variant-form-page.component';
import { RecipesPageComponent } from './recipes-page.component';

export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipesPageComponent, data: { title: 'Recettes' } },
  { path: 'new', component: RecipeFormPageComponent, data: { title: 'Nouvelle recette' } },
  {
    path: ':id/photo-prompt',
    loadComponent: () =>
      import('./components/photo-prompt-page/photo-prompt-page.component').then(
        (m) => m.PhotoPromptPageComponent,
      ),
    data: { title: 'Ajouter une photo' },
  },
  {
    path: ':id/variants/new',
    component: RecipeVariantFormPageComponent,
    data: { title: 'Nouvelle variante' },
  },
  { path: ':id/edit', component: RecipeEditPageComponent, data: { title: 'Modifier la recette' } },
  { path: ':id', component: RecipeDetailPageComponent, data: { title: 'Détail recette' } },
];
