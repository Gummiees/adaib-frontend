import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenRefreshService } from '@features/user/services/token-refresh.service';
import { userEvent } from '@features/user/store/user-events';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError, switchMap, throwError } from 'rxjs';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const userStore = inject(UserStore);
  const tokenRefreshService = inject(TokenRefreshService);
  const dispatcher = inject(Dispatcher);
  const user = userStore.user();

  if (!user?.authToken) {
    return next(req);
  }

  if (tokenRefreshService.isTokenExpiredOrExpiring(user)) {
    return tokenRefreshService.refreshTokenIfNeeded(user).pipe(
      switchMap((refreshedUser) => {
        const modifiedReq = req.clone({
          withCredentials: true,
          setHeaders: {
            Authorization: `Bearer ${refreshedUser.authToken}`,
          },
        });
        return next(modifiedReq);
      }),
      catchError((error) => {
        dispatcher.dispatch(userEvent.logout());
        return throwError(() => error);
      }),
    );
  }

  const modifiedReq = req.clone({
    withCredentials: true,
    setHeaders: {
      Authorization: `Bearer ${user.authToken}`,
    },
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't attempt token refresh for auth-related requests to avoid infinite loops
      const isAuthRequest = req.url.includes('/auth/');

      if (error.status === 401 && user.refreshToken && !isAuthRequest) {
        return tokenRefreshService.refreshTokenIfNeeded(user).pipe(
          switchMap((refreshedUser) => {
            const retryReq = req.clone({
              withCredentials: true,
              setHeaders: {
                Authorization: `Bearer ${refreshedUser.authToken}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            dispatcher.dispatch(userEvent.logout());
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
