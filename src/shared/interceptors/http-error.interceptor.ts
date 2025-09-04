import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { snackbarEvent } from '@shared/stores/snackbar/snackbar-events';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const dispatcher = inject(Dispatcher);

  return next(req).pipe(
    catchError((error) => {
      let message: string | null = 'An error occurred';
      if (error instanceof HttpErrorResponse) {
        if (error.status === HttpStatusCode.NotFound) {
          message = null;
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        } else {
          message = error.error?.message || 'Something went wrong';
        }
      }

      if (message) {
        dispatcher.dispatch(
          snackbarEvent.show({
            message,
            type: 'error',
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
