import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserStore } from '@features/user/store/user-store';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const userStore = inject(UserStore);
  const user = userStore.user();

  let modifiedReq = req;

  // Add Bearer token if user is available and has authToken
  if (user?.authToken) {
    modifiedReq = modifiedReq.clone({
      withCredentials: true,
      setHeaders: {
        Authorization: `Bearer ${user.authToken}`,
      },
    });
  }

  return next(modifiedReq);
};
