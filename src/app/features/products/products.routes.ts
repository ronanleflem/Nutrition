import { Routes } from '@angular/router';

import { ProductFormPageComponent } from './components/product-form-page/product-form-page.component';
import { ProductsPageComponent } from './products-page.component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductsPageComponent },
  { path: 'new', component: ProductFormPageComponent, data: { title: 'Nouveau produit' } },
  {
    path: ':id/edit',
    component: ProductFormPageComponent,
    data: { title: 'Modifier le produit' },
  },
];
