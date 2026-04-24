import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-bg">
      <div class="auth-card glass">
        <div class="auth-logo">
          <div class="logo-circle">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="url(#rg1)"/>
              <path d="M8 13c0-2 1.6-3.5 3.5-3.5H28.5C30.4 9.5 32 11 32 13V22c0 2-1.6 3.5-3.5 3.5H23l-5 3.5v-3.5H11.5C9.6 25.5 8 24 8 22V13z" fill="white"/>
              <circle cx="15" cy="17.5" r="1.5" fill="url(#rg1)"/>
              <circle cx="20" cy="17.5" r="1.5" fill="url(#rg1)"/>
              <circle cx="25" cy="17.5" r="1.5" fill="url(#rg1)"/>
              <defs><linearGradient id="rg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stop-color="#7C3AED"/><stop offset="1" stop-color="#A855F7"/>
              </linearGradient></defs>
            </svg>
          </div>
          <h1>TalkifyX</h1>
        </div>
        <h2>Create account</h2>
        <p class="subtitle">Join TalkifyX today</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Full Name</label>
            <div class="input-wrap" [class.error]="isInvalid('fullName')">
              <input type="text" formControlName="fullName" placeholder="John Doe"/>
            </div>
            @if(isInvalid('fullName')){ <span class="err">Full name is required</span> }
          </div>

          <div class="field">
            <label>Username</label>
            <div class="input-wrap" [class.error]="isInvalid('username')">
              <span class="prefix">&#64;</span>
              <input type="text" formControlName="username" placeholder="johndoe"/>
            </div>
            @if(isInvalid('username')){ <span class="err">Username must be 3-20 characters</span> }
          </div>

          <div class="field">
            <label>Email</label>
            <div class="input-wrap" [class.error]="isInvalid('email')">
              <input type="email" formControlName="email" placeholder="john@example.com"/>
            </div>
            @if(isInvalid('email')){ <span class="err">Valid email is required</span> }
          </div>

          <div class="field">
            <label>Password</label>
            <div class="input-wrap" [class.error]="isInvalid('password')">
              <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="Min 6 characters"/>
              <button type="button" class="toggle-pass" (click)="showPass.set(!showPass())">
                @if(showPass()) {
                  <svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                } @else {
                  <svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                }
              </button>
            </div>
            @if(isInvalid('password')){ <span class="err">Password must be at least 6 characters</span> }
          </div>

          @if(error()) {
            <div class="alert-error">{{ error() }}</div>
          }
          @if(success()) {
            <div class="alert-success">{{ success() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if(loading()) {
              <span class="spinner"></span> Creating account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <p class="auth-link">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f4ff 0%, #ede8ff 50%, #e4d9ff 100%);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .glass {
      background: rgba(255,255,255,0.7); backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 8px 32px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.05);
    }
    .auth-card { width: 100%; max-width: 420px; border-radius: 24px; padding: 40px; }
    .auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo-circle { width: 44px; height: 44px; }
    .logo-circle svg { width: 100%; height: 100%; }
    .auth-logo h1 {
      font-size: 1.8rem; font-weight: 800;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; margin: 0;
    }
    h2 { font-size: 1.5rem; font-weight: 700; color: #1F2937; margin: 0 0 4px; }
    .subtitle { color: #6B7280; margin: 0 0 24px; font-size: 0.9rem; }
    .field { margin-bottom: 16px; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .input-wrap {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.8); border: 1.5px solid #E5E7EB;
      border-radius: 12px; padding: 0 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrap:focus-within { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
    .input-wrap.error { border-color: #EF4444; }
    .prefix { color: #9CA3AF; font-weight: 500; }
    input { flex: 1; border: none; background: transparent; padding: 13px 8px; font-size: 0.95rem; color: #1F2937; outline: none; }
    .toggle-pass { background: none; border: none; cursor: pointer; padding: 0; color: #9CA3AF; display: flex; align-items: center; }
    .err { font-size: 0.78rem; color: #EF4444; margin-top: 4px; display: block; }
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 10px 14px; font-size: 0.875rem; margin-bottom: 16px; }
    .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; border-radius: 10px; padding: 10px 14px; font-size: 0.875rem; margin-bottom: 16px; }
    .btn-primary {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #7C3AED, #A855F7);
      color: white; border: none; border-radius: 12px; font-size: 1rem;
      font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-link { text-align: center; margin-top: 20px; color: #6B7280; font-size: 0.9rem; }
    .auth-link a { color: #7C3AED; font-weight: 600; text-decoration: none; }
    .auth-link a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    fullName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  loading = signal(false);
  error = signal('');
  success = signal('');
  showPass = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set(''); this.success.set('');
    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.success.set('Account created! Signing you in...');
        this.auth.login({ usernameOrEmail: this.form.value.email!, password: this.form.value.password! }).subscribe({
          next: () => this.router.navigate(['/chat']),
          error: () => { this.loading.set(false); this.router.navigate(['/auth/login']); }
        });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
