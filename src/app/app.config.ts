import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";

import { environment } from "@environments/environment";
import { provideStore } from "@ngrx/store";
import { httpErrorInterceptor } from "@shared/interceptors/http-error.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideStore(),
    environment.providers,
  ],
};
