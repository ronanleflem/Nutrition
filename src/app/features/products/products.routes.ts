import { Routes } from '@angular/router';

import { ProductDetailPageComponent } from './components/product-detail-page/product-detail-page.component';
import { ProductFormPageComponent } from './components/product-form-page/product-form-page.component';
import { ReferenceFormPageComponent } from './components/reference-form-page/reference-form-page.component';
import { ScanReferencePageComponent } from './components/scan-reference-page/scan-reference-page.component';
import { ScannerPageComponent } from './components/scanner-page/scanner-page.component';
import { ProductsPageComponent } from './products-page.component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductsPageComponent },
  { path: 'scan', component: ScannerPageComponent, data: { title: 'Scanner' } },
  {
    path: 'scan/reference',
    component: ScanReferencePageComponent,
    data: { title: 'Nouvelle référence (scan)' },
  },
  { path: 'new', component: ProductFormPageComponent, data: { title: 'Nouveau produit' } },
  {
    path: ':productId/references/new',
    component: ReferenceFormPageComponent,
    data: { title: 'Nouvelle référence' },
  },
  {
    path: ':productId/references/:refId/edit',
    component: ReferenceFormPageComponent,
    data: { title: 'Modifier la référence' },
  },
  {
    path: ':id/edit',
    component: ProductFormPageComponent,
    data: { title: 'Modifier le produit' },
  },
  { path: ':id', component: ProductDetailPageComponent, data: { title: 'Détail produit' } },
];
