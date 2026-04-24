import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const userId = auth.getUserId();

  if (token) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`
    };
    if (userId) {
      headers['X-User-Id'] = String(userId);
    }
    const cloned = req.clone({ setHeaders: headers });
    return next(cloned);
  }
  return next(req);
};
