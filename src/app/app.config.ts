import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { provideStore } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { contentTypeInterceptor } from '@shared/interceptors/content-type.interceptor';
import { credentialsInterceptor } from '@shared/interceptors/credentials.interceptor';
import { retryInterceptor } from '@shared/interceptors/retry.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
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
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),
  ],
};
