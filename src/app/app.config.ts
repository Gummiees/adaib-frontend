import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import { Title } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { contentTypeInterceptor } from '@shared/interceptors/content-type.interceptor';
import { credentialsInterceptor } from '@shared/interceptors/credentials.interceptor';
import { retryInterceptor } from '@shared/interceptors/retry.interceptor';
import { SEOService } from '@shared/services/seo.service';
import { ServiceWorkerCleanupService } from '@shared/services/service-worker-cleanup.service';
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
      inject(ServiceWorkerCleanupService);
      const seoService = inject(SEOService);
      const titleService = inject(TitleService);
      seoService.init();
      titleService.init();
    }),
  ],
};
