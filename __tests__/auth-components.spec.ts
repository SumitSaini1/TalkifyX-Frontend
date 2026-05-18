import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';

import { LoginComponent } from '../src/app/features/auth/login/login.component';
import { RegisterComponent } from '../src/app/features/auth/register/register.component';
import { AuthService } from '../src/app/core/services/auth.service';
import { FcmService } from '../src/app/core/services/fcm.service';

const activatedRouteStub = { snapshot: { queryParams: {} } };

// ============================================================
//  LoginComponent
// ============================================================
describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: any;
  let fcmService: any;
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    authService = { login: jest.fn(), getProfile: jest.fn() };
    fcmService  = { initFcm: jest.fn() };
    router      = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService,    useValue: authService },
        { provide: FcmService,     useValue: fcmService },
        { provide: Router,         useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('form should be invalid when empty', () => expect(component.form.invalid).toBe(true));

  it('form should be valid with correct values', () => {
    component.form.setValue({ usernameOrEmail: 'testuser', password: 'pass123' });
    expect(component.form.valid).toBe(true);
  });

  it('isInvalid() returns true when field is invalid and touched', () => {
    component.form.get('usernameOrEmail')?.markAsTouched();
    expect(component.isInvalid('usernameOrEmail')).toBe(true);
  });

  it('isInvalid() returns false when field is untouched', () => {
    expect(component.isInvalid('usernameOrEmail')).toBe(false);
  });

  it('submit() should not call login when form invalid', () => {
    component.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submit() should call auth.login with form values', () => {
    authService.login.mockReturnValue(of({ token: 'tok', type: 'Bearer', user: {} as any }));
    authService.getProfile.mockReturnValue(of({} as any));
    component.form.setValue({ usernameOrEmail: 'user', password: 'pass' });
    component.submit();
    expect(authService.login).toHaveBeenCalledWith({ usernameOrEmail: 'user', password: 'pass' });
  });

  it('submit() should navigate to /chat on success', () => {
    authService.login.mockReturnValue(of({ token: 'tok', type: 'Bearer', user: {} as any }));
    authService.getProfile.mockReturnValue(of({} as any));
    component.form.setValue({ usernameOrEmail: 'user', password: 'pass' });
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('submit() should set error signal on login failure', () => {
    authService.login.mockReturnValue(throwError(() => ({ error: { message: 'Bad creds' } })));
    component.form.setValue({ usernameOrEmail: 'user', password: 'wrong' });
    component.submit();
    expect(component.error()).toBe('Bad creds');
  });

  it('submit() should set fallback error message', () => {
    authService.login.mockReturnValue(throwError(() => ({})));
    component.form.setValue({ usernameOrEmail: 'user', password: 'wrong' });
    component.submit();
    expect(component.error()).toBe('Invalid credentials. Please try again.');
  });

  it('loading signal should be true while request is in flight', () => {
    const subject = new Subject();
    authService.login.mockReturnValue(subject.asObservable());
    component.form.setValue({ usernameOrEmail: 'user', password: 'pass' });
    component.submit();
    expect(component.loading()).toBe(true);
  });

  it('showPass toggles password visibility', () => {
    expect(component.showPass()).toBe(false);
    component.showPass.set(true);
    expect(component.showPass()).toBe(true);
  });
});

// ============================================================
//  RegisterComponent
// ============================================================
describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authService: any;
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn() };
    router      = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService,    useValue: authService },
        { provide: Router,         useValue: router },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('form should be invalid when empty', () => expect(component.form.invalid).toBe(true));

  it('form should be valid with all correct fields', () => {
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'john@test.com', password: 'pass123' });
    expect(component.form.valid).toBe(true);
  });

  it('username < 3 chars is invalid', () => {
    component.form.patchValue({ username: 'ab' });
    expect(component.form.get('username')?.invalid).toBe(true);
  });

  it('email invalid format is invalid', () => {
    component.form.patchValue({ email: 'notanemail' });
    expect(component.form.get('email')?.invalid).toBe(true);
  });

  it('password < 6 chars is invalid', () => {
    component.form.patchValue({ password: '123' });
    expect(component.form.get('password')?.invalid).toBe(true);
  });

  it('submit() should not call register when invalid', () => {
    component.submit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('submit() should call register then login', () => {
    authService.register.mockReturnValue(of({ status: 'ok', message: '', data: null }));
    authService.login.mockReturnValue(of({ token: 'tok', type: 'Bearer', user: {} as any }));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(authService.register).toHaveBeenCalled();
    expect(authService.login).toHaveBeenCalled();
  });

  it('should navigate to /chat after success', () => {
    authService.register.mockReturnValue(of({ status: 'ok', message: '', data: null }));
    authService.login.mockReturnValue(of({ token: 'tok', type: 'Bearer', user: {} as any }));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('should set error on register failure', () => {
    authService.register.mockReturnValue(throwError(() => ({ error: { message: 'User exists' } })));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(component.error()).toBe('User exists');
  });

  it('should fallback error message', () => {
    authService.register.mockReturnValue(throwError(() => ({})));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(component.error()).toBe('Registration failed. Please try again.');
  });

  it('should set success message after register', () => {
    authService.register.mockReturnValue(of({ status: 'ok', message: '', data: null }));
    authService.login.mockReturnValue(of({ token: 'tok', type: 'Bearer', user: {} as any }));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(component.success()).toBe('Account created! Signing you in...');
  });

  it('navigate to login if login after register fails', () => {
    authService.register.mockReturnValue(of({ status: 'ok', message: '', data: null }));
    authService.login.mockReturnValue(throwError(() => ({})));
    component.form.setValue({ fullName: 'John', username: 'johndoe', email: 'j@j.com', password: 'pass123' });
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
