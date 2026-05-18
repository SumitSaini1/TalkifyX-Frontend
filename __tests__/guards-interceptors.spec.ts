import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuthService } from '../src/app/core/services/auth.service';
import { authGuard, guestGuard } from '../src/app/core/guards/auth.guard';
import { jwtInterceptor } from '../src/app/core/interceptors/jwt.interceptor';
import { errorInterceptor } from '../src/app/core/interceptors/error.interceptor';

// ============================================================
//  authGuard
// ============================================================
describe('authGuard', () => {
  let authService: any;
  let router: { createUrlTree: jest.Mock };

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() };
    router = { createUrlTree: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('returns true when authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => authGuard({} as any, {} as any))).toBe(true);
  });

  it('redirects to /auth/login when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);
    router.createUrlTree.mockReturnValue({} as UrlTree);
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });
});

// ============================================================
//  guestGuard
// ============================================================
describe('guestGuard', () => {
  let authService: any;
  let router: { createUrlTree: jest.Mock };

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() };
    router = { createUrlTree: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('returns true when NOT authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any))).toBe(true);
  });

  it('redirects to /chat when already authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    router.createUrlTree.mockReturnValue({} as UrlTree);
    TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/chat']);
  });
});

// ============================================================
//  jwtInterceptor
// ============================================================
describe('jwtInterceptor', () => {
  let authService: { getToken: jest.Mock; getUserId: jest.Mock };

  beforeEach(() => {
    authService = { getToken: jest.fn(), getUserId: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }],
    });
  });

  it('should attach Authorization and X-User-Id headers when token exists', (done) => {
    authService.getToken.mockReturnValue('tok-123');
    authService.getUserId.mockReturnValue(7);
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = (r) => {
      expect(r.headers.get('Authorization')).toBe('Bearer tok-123');
      expect(r.headers.get('X-User-Id')).toBe('7');
      done();
      return of(new HttpResponse({ status: 200 }));
    };
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next));
  });

  it('should pass request unchanged when no token', (done) => {
    authService.getToken.mockReturnValue(null);
    authService.getUserId.mockReturnValue(null);
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = (r) => {
      expect(r.headers.get('Authorization')).toBeNull();
      done();
      return of(new HttpResponse({ status: 200 }));
    };
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next));
  });
});

// ============================================================
//  errorInterceptor
// ============================================================
describe('errorInterceptor', () => {
  let authService: any;
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    authService = {
      isAuthenticated: { set: jest.fn() },
      currentUser: { set: jest.fn() },
    };
    router = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    localStorage.setItem('talkifyx_token', 'tok');
  });
  afterEach(() => localStorage.clear());

  it('should clear token and redirect on 401', (done) => {
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401 }));
    TestBed.runInInjectionContext(() =>
      errorInterceptor(new HttpRequest('GET', '/test'), next).subscribe({
        error: () => {
          expect(localStorage.getItem('talkifyx_token')).toBeNull();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        },
      })
    );
  });

  it('should pass through non-401 errors', (done) => {
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 500 }));
    TestBed.runInInjectionContext(() =>
      errorInterceptor(new HttpRequest('GET', '/test'), next).subscribe({
        error: (e: HttpErrorResponse) => {
          expect(e.status).toBe(500);
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        },
      })
    );
  });
});
