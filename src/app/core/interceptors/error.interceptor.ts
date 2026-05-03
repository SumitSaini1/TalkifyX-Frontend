import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
       
        localStorage.removeItem('talkifyx_token');
        localStorage.removeItem('talkifyx_user');
        auth.isAuthenticated.set(false);
        auth.currentUser.set(null);
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
