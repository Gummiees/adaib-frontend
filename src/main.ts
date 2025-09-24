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
  release: 'basket-project@' + version,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  enableLogs: true,
  beforeSendLog: (logEvent) => {
    if (environment.isProduction) {
      return logEvent;
    }
    return null;
  },
});

inject();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
