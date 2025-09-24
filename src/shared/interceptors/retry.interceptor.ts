import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import { catchError, retry, throwError } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse) {
          const status = error.status;
          if (status === 0 || (status >= 500 && status < 600)) {
            const delay = Math.pow(2, retryCount - 1) * 1000;
            return new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw error;
      },
    }),
    catchError((error: HttpErrorResponse) => {
      Sentry.captureException('Request failed after 3 attempts');
      console.error('Request failed after 3 attempts:', error);
      return throwError(() => error);
    }),
  );
};
