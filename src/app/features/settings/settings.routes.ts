import { Routes } from '@angular/router';

import { ArchivedProductsPageComponent } from './components/archived-products-page/archived-products-page.component';
import { ExportPageComponent } from './components/export-page/export-page.component';
import { SettingsPageComponent } from './settings-page.component';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  {
    path: 'export',
    component: ExportPageComponent,
    data: { title: 'Exporter' },
  },
  {
    path: 'archived-products',
    component: ArchivedProductsPageComponent,
    data: { title: 'Produits archivés' },
  },
];
