import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, isDevMode, inject } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { AppBootstrapService } from './core/bootstrap/app-bootstrap.service';
import { DatabaseService } from './core/database/database.service';
import { ThemeService } from './core/layout/theme/theme.service';

const BOOTSTRAP_STORAGE_ERROR =
  'Stockage local indisponible. Vérifiez que le mode navigation privée est désactivé et réessayez.';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(async () => {
      const database = inject(DatabaseService);
      const theme = inject(ThemeService);
      const bootstrap = inject(AppBootstrapService);

      try {
        await database.initialize();
        await theme.applyFromSettings();
      } catch (error) {
        console.error('Application bootstrap failed:', error);
        bootstrap.setBootstrapError(BOOTSTRAP_STORAGE_ERROR);
        theme.applyTheme('dark');
      }
    }),
  ],
};
