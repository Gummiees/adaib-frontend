import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { userEvent } from '@features/user/store/user-events';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError } from 'rxjs/operators';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const dispatcher = inject(Dispatcher);
  return next(req).pipe(
    catchError((error) => {
      if (error.status === HttpStatusCode.Unauthorized) {
        dispatcher.dispatch(userEvent.logout());
      }
      throw error;
    }),
  );
};
