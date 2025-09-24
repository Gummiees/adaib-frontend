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
  dsn: 'hhttps://dfc8cd33d0a05fca1bd5dd738930ca68@o4510073749700608.ingest.de.sentry.io/4510073757761616',
  release: 'adaib-frontend@' + version,
  tunnel: '/tunnel',
  integrations: [
    Sentry.consoleLoggingIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserSessionIntegration(),
    Sentry.httpClientIntegration(),
    Sentry.replayIntegration(),
  ],
  beforeSend: (event) => {
    console.log('sending event to sentry', event);
    if (environment.isProduction) {
      return event;
    }
    // FIXME: Return null
    return event;
  },
  enableLogs: true,
  // Tracing
  // FIXME: change to 0.25
  tracesSampleRate: 1.0,
  tracePropagationTargets: [
    'localhost',
    'adaib.com',
    /^https:\/\/basketwebapi-production\.up\.railway\.app\/api/,
  ],
  // Session Replay
  // FIXME: change to 0.1
  replaysSessionSampleRate: 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

inject();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
