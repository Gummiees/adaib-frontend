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

import {
  provideRouter,
  Router,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { provideStore } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { credentialsInterceptor } from '@shared/interceptors/credentials.interceptor';
import { retryInterceptor } from '@shared/interceptors/retry.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([retryInterceptor, credentialsInterceptor]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideStore(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
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
