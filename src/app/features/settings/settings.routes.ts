import { Routes } from '@angular/router';

import { ArchivedProductsPageComponent } from './components/archived-products-page/archived-products-page.component';
import { DataSourcesPageComponent } from './components/data-sources-page/data-sources-page.component';
import { ExportPageComponent } from './components/export-page/export-page.component';
import { ImportPageComponent } from './components/import-page/import-page.component';
import { SettingsPageComponent } from './settings-page.component';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  {
    path: 'export',
    component: ExportPageComponent,
    data: { title: 'Exporter' },
  },
  {
    path: 'import',
    component: ImportPageComponent,
    data: { title: 'Importer' },
  },
  {
    path: 'archived-products',
    component: ArchivedProductsPageComponent,
    data: { title: 'Produits archivés' },
  },
  {
    path: 'data-sources',
    component: DataSourcesPageComponent,
    data: { title: 'Sources de données' },
  },
];
