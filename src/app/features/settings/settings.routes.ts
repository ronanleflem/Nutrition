import { Routes } from '@angular/router';

import { ArchivedProductsPageComponent } from './components/archived-products-page/archived-products-page.component';
import { SettingsPageComponent } from './settings-page.component';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  {
    path: 'archived-products',
    component: ArchivedProductsPageComponent,
    data: { title: 'Produits archivés' },
  },
];
