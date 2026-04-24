import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-bg">
      <div class="auth-card glass">
        <div class="auth-logo">
          <div class="logo-circle">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="url(#lg1)"/>
              <path d="M8 13c0-2 1.6-3.5 3.5-3.5H28.5C30.4 9.5 32 11 32 13V22c0 2-1.6 3.5-3.5 3.5H23l-5 3.5v-3.5H11.5C9.6 25.5 8 24 8 22V13z" fill="white"/>
              <circle cx="15" cy="17.5" r="1.5" fill="url(#lg1)"/>
              <circle cx="20" cy="17.5" r="1.5" fill="url(#lg1)"/>
              <circle cx="25" cy="17.5" r="1.5" fill="url(#lg1)"/>
              <defs><linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stop-color="#7C3AED"/><stop offset="1" stop-color="#A855F7"/>
              </linearGradient></defs>
            </svg>
          </div>
          <h1>TalkifyX</h1>
        </div>
        <h2>Welcome back</h2>
        <p class="subtitle">Sign in to your account</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Username or Email</label>
            <div class="input-wrap" [class.error]="isInvalid('usernameOrEmail')">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 17a6.974 6.974 0 01-4.696-1.81z"/></svg>
              <input type="text" formControlName="usernameOrEmail" placeholder="Enter username or email" autocomplete="username"/>
            </div>
            @if(isInvalid('usernameOrEmail')) {
              <span class="err">Username or email is required</span>
            }
          </div>

          <div class="field">
            <label>Password</label>
            <div class="input-wrap" [class.error]="isInvalid('password')">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
              <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="Enter password" autocomplete="current-password"/>
              <button type="button" class="toggle-pass" (click)="showPass.set(!showPass())">
                @if(showPass()) {
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                } @else {
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                }
              </button>
            </div>
            @if(isInvalid('password')) {
              <span class="err">Password is required</span>
            }
          </div>

          @if(error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if(loading()) {
              <span class="spinner"></span> Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="divider"><span>or</span></div>

        <a class="oauth-btn" [href]="oauthUrl">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>

        <p class="auth-link">Don't have an account? <a routerLink="/auth/register">Sign up</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f4ff 0%, #ede8ff 50%, #e4d9ff 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .glass {
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 8px 32px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.05);
    }
    .auth-card {
      width: 100%; max-width: 420px;
      border-radius: 24px; padding: 40px;
    }
    .auth-logo {
      display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
    }
    .logo-circle { width: 44px; height: 44px; }
    .logo-circle svg { width: 100%; height: 100%; }
    .auth-logo h1 {
      font-size: 1.8rem; font-weight: 800;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin: 0;
    }
    h2 { font-size: 1.5rem; font-weight: 700; color: #1F2937; margin: 0 0 4px; }
    .subtitle { color: #6B7280; margin: 0 0 28px; font-size: 0.9rem; }
    .field { margin-bottom: 18px; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .input-wrap {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.8); border: 1.5px solid #E5E7EB;
      border-radius: 12px; padding: 0 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrap:focus-within {
      border-color: #7C3AED;
      box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
    }
    .input-wrap.error { border-color: #EF4444; }
    .input-wrap svg:first-child { width: 18px; height: 18px; color: #9CA3AF; flex-shrink: 0; }
    input {
      flex: 1; border: none; background: transparent; padding: 13px 10px;
      font-size: 0.95rem; color: #1F2937; outline: none;
    }
    .toggle-pass {
      background: none; border: none; cursor: pointer; padding: 0;
      color: #9CA3AF; display: flex; align-items: center;
    }
    .toggle-pass svg { width: 18px; height: 18px; }
    .err { font-size: 0.78rem; color: #EF4444; margin-top: 4px; display: block; }
    .alert-error {
      background: #FEF2F2; border: 1px solid #FECACA;
      color: #B91C1C; border-radius: 10px; padding: 10px 14px;
      font-size: 0.875rem; margin-bottom: 16px;
    }
    .btn-primary {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: white; border: none; border-radius: 12px;
      font-size: 1rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider {
      display: flex; align-items: center; gap: 12px;
      margin: 20px 0; color: #D1D5DB; font-size: 0.85rem;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #E5E7EB;
    }
    .divider span { color: #9CA3AF; }
    .oauth-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 13px;
      background: rgba(255,255,255,0.9); border: 1.5px solid #E5E7EB;
      border-radius: 12px; font-size: 0.95rem; font-weight: 500;
      color: #374151; text-decoration: none; cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .oauth-btn:hover {
      border-color: #7C3AED;
      box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
    }
    .auth-link {
      text-align: center; margin-top: 20px; color: #6B7280; font-size: 0.9rem;
    }
    .auth-link a { color: #7C3AED; font-weight: 600; text-decoration: none; }
    .auth-link a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required]
  });
  loading = signal(false);
  error = signal('');
  showPass = signal(false);
  oauthUrl = 'http://localhost:8080/oauth2/authorization/google';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
      }
    });
  }
}
