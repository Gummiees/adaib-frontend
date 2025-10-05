import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from '@environments/environment';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { version } from '../package.json';
import { App } from './app/app';
import { appConfig } from './app/app.config';

registerLocaleData(localeEs, 'es-ES');

inject();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
