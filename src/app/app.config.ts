import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

import { Title } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { contentTypeInterceptor } from '@shared/interceptors/content-type.interceptor';
import { credentialsInterceptor } from '@shared/interceptors/credentials.interceptor';
import { retryInterceptor } from '@shared/interceptors/retry.interceptor';
import { PwaUpdateService } from '@shared/services/pwa-update.service';
import { SEOService } from '@shared/services/seo.service';
import { TitleService } from '@shared/services/title.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
    Title,
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([
        retryInterceptor,
        credentialsInterceptor,
        contentTypeInterceptor,
      ]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideStore(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideAppInitializer(() => {
      inject(PwaUpdateService);
      const seoService = inject(SEOService);
      const titleService = inject(TitleService);
      seoService.init();
      titleService.init();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
