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
  dsn: 'https://4b5eae1f296ef561f19699170b60cfd6@o4509965930594304.ingest.de.sentry.io/4509965931708496',
  release: 'basket-project@' + version,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  enableLogs: true,
  beforeSendLog: (logEvent) => {
    if (!environment.isProduction) {
      return null;
    }
    return logEvent;
  },
});

inject();
injectSpeedInsights();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
