import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from '@environments/environment';
import * as Sentry from '@sentry/angular';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { version } from '../package.json';
import { App } from './app/app';
import { appConfig } from './app/app.config';

registerLocaleData(localeEs, 'es-ES');

Sentry.init({
  dsn: 'https://dfc8cd33d0a05fca1bd5dd738930ca68@o4510073749700608.ingest.de.sentry.io/4510073757761616',
  release: 'adaib-frontend@' + version,
  integrations: [
    Sentry.consoleLoggingIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserSessionIntegration(),
    Sentry.httpClientIntegration(),
    Sentry.replayIntegration(),
  ],
  beforeSend: (event) => {
    if (environment.isProduction) {
      return event;
    }
    return null;
  },
  // Tracing
  tracesSampleRate: 0.25,
  tracePropagationTargets: [
    'localhost',
    'adaib.com',
    /^https:\/\/basketwebapi-production\.up\.railway\.app\/api/,
  ],
  // Session Replay
  replaysSessionSampleRate: 0.25,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});

inject();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
