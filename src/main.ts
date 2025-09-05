import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { App } from './app/app';
import { appConfig } from './app/app.config';

Sentry.init({
  dsn: 'https://4b5eae1f296ef561f19699170b60cfd6@o4509965930594304.ingest.de.sentry.io/4509965931708496',
});

inject();
injectSpeedInsights();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
