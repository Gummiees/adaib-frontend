import { HttpInterceptorFn } from '@angular/common/http';

export const contentTypeInterceptor: HttpInterceptorFn = (req, next) => {
  let modifiedReq = req;

  if (req.method !== 'GET') {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  return next(modifiedReq);
};
