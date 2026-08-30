import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, isDevMode, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { DatabaseService } from './core/database/database.service';
import { ThemeService } from './core/layout/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(async () => {
      const database = inject(DatabaseService);
      const theme = inject(ThemeService);
      await database.initialize();
      await theme.applyFromSettings();
    }),
  ],
};
