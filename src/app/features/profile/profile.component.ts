import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { MediaService } from "../../core/services/media.service";
import { User, UserStatus } from "../../core/models";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="profile-bg">
      <div class="profile-card glass">
        <!-- Back -->
        <div class="top-bar">
          <button class="back-btn" routerLink="/chat">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Back to Chats
          </button>
          <button class="danger-btn" (click)="logout()">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clip-rule="evenodd"
              />
            </svg>
            Sign Out
          </button>
        </div>

        <!-- Avatar section -->
        <div class="avatar-section">
          <div class="avatar-ring" (click)="avatarInput.click()">
            <img
              [src]="user()?.avatarUrl || avatarPlaceholder()"
              class="profile-avatar"
              [alt]="user()?.fullName"
            />
            <div class="avatar-overlay">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <span
              class="status-dot"
              [class]="'status-' + (user()?.status || 'ONLINE').toLowerCase()"
            ></span>
          </div>
          <input
            #avatarInput
            type="file"
            accept="image/*"
            hidden
            (change)="onAvatarChange($event)"
          />
          <div class="name-block">
            <h2>{{ user()?.fullName }}</h2>
            <span class="username-tag">&#64;{{ user()?.username }}</span>
          </div>
        </div>

        <!-- Status selector -->
        <div class="status-section">
          <label class="section-label">Status</label>
          <div class="status-pills">
            @for (s of statuses; track s.value) {
              <button
                class="status-pill"
                [class.active]="user()?.status === s.value"
                (click)="updateStatus(s.value)"
              >
                <span
                  class="dot"
                  [class]="'dot-' + s.value.toLowerCase()"
                ></span>
                {{ s.label }}
              </button>
            }
          </div>
        </div>

        <!-- Tabs -->
        <div class="profile-tabs">
          <button
            class="ptab"
            [class.active]="activeTab() === 'profile'"
            (click)="activeTab.set('profile')"
          >
            Edit Profile
          </button>
          <button
            class="ptab"
            [class.active]="activeTab() === 'password'"
            (click)="activeTab.set('password')"
          >
            Password
          </button>
        </div>

        <!-- Profile Form -->
        @if (activeTab() === "profile") {
          <form
            [formGroup]="profileForm"
            (ngSubmit)="saveProfile()"
            class="form-section"
          >
            <div class="field">
              <label>Full Name</label>
              <input
                class="text-input"
                formControlName="fullName"
                placeholder="Your full name"
              />
            </div>
            <div class="field">
              <label>Username</label>
              <div class="input-prefix-wrap">
                <span class="prefix">&#64;</span>
                <input
                  class="text-input no-left-pad"
                  formControlName="username"
                  placeholder="username"
                />
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input
                class="text-input"
                [value]="user()?.email"
                disabled
                placeholder="Email"
              />
            </div>
            @if (profileSuccess()) {
              <div class="alert-success">Profile updated successfully!</div>
            }
            @if (profileError()) {
              <div class="alert-error">{{ profileError() }}</div>
            }
            <button type="submit" class="save-btn" [disabled]="profileSaving()">
              @if (profileSaving()) {
                <span class="mini-spinner white"></span>
              }
              Save Changes
            </button>
          </form>
        }

        <!-- Password Form -->
        @if (activeTab() === "password") {
          <form
            [formGroup]="passwordForm"
            (ngSubmit)="changePassword()"
            class="form-section"
          >
            <div class="field">
              <label>Current Password</label>
              <input
                class="text-input"
                type="password"
                formControlName="currentPassword"
                placeholder="Enter current password"
              />
            </div>
            <div class="field">
              <label>New Password</label>
              <input
                class="text-input"
                type="password"
                formControlName="newPassword"
                placeholder="Min 6 characters"
              />
            </div>
            <div class="field">
              <label>Confirm New Password</label>
              <input
                class="text-input"
                type="password"
                formControlName="confirmPassword"
                placeholder="Repeat new password"
              />
              @if (
                passwordForm.errors?.["mismatch"] &&
                passwordForm.get("confirmPassword")?.touched
              ) {
                <span class="err">Passwords do not match</span>
              }
            </div>
            @if (pwSuccess()) {
              <div class="alert-success">Password changed successfully!</div>
            }
            @if (pwError()) {
              <div class="alert-error">{{ pwError() }}</div>
            }
            <button type="submit" class="save-btn" [disabled]="pwSaving()">
              @if (pwSaving()) {
                <span class="mini-spinner white"></span>
              }
              Change Password
            </button>
          </form>
        }

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">Member since</span>
            <span class="stat-val">{{ formatDate(user()?.createdAt) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last seen</span>
            <span class="stat-val">{{ formatDate(user()?.lastSeenAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-bg {
        min-height: 100vh;
        background: linear-gradient(
          135deg,
          #f8f4ff 0%,
          #ede8ff 50%,
          #e4d9ff 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .glass {
        background: rgba(255, 255, 255, 0.78);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 40px rgba(124, 58, 237, 0.12);
      }
      .profile-card {
        width: 100%;
        max-width: 500px;
        border-radius: 28px;
        padding: 32px;
      }
      .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
      }
      .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: #7c3aed;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 10px;
        transition: background 0.15s;
        text-decoration: none;
      }
      .back-btn:hover {
        background: rgba(124, 58, 237, 0.08);
      }
      .back-btn svg {
        width: 16px;
        height: 16px;
      }
      .danger-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fef2f2;
        border: none;
        color: #ef4444;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 10px;
        transition: background 0.15s;
      }
      .danger-btn:hover {
        background: #fee2e2;
      }
      .danger-btn svg {
        width: 16px;
        height: 16px;
      }

      .avatar-section {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
      }
      .avatar-ring {
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
        border-radius: 50%;
        display: inline-block;
      }
      .profile-avatar {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(124, 58, 237, 0.25);
        display: block;
      }
      .avatar-overlay {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(124, 58, 237, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .avatar-ring:hover .avatar-overlay {
        opacity: 1;
      }
      .avatar-overlay svg {
        width: 24px;
        height: 24px;
        color: white;
      }
      .status-dot {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 3px solid white;
      }
      .status-online {
        background: #10b981;
      }
      .status-away {
        background: #f59e0b;
      }
      .status-dnd {
        background: #ef4444;
      }
      .status-invisible {
        background: #9ca3af;
      }
      .name-block h2 {
        font-size: 1.4rem;
        font-weight: 800;
        color: #1f2937;
        margin: 0 0 4px;
      }
      .username-tag {
        font-size: 0.85rem;
        color: #9ca3af;
      }

      .status-section {
        margin-bottom: 20px;
      }
      .section-label {
        display: block;
        font-size: 0.82rem;
        font-weight: 700;
        color: #374151;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .status-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .status-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 20px;
        background: transparent;
        font-size: 0.82rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.15s;
      }
      .status-pill.active {
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .dot-online {
        background: #10b981;
      }
      .dot-away {
        background: #f59e0b;
      }
      .dot-dnd {
        background: #ef4444;
      }
      .dot-invisible {
        background: #9ca3af;
      }

      .profile-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
      }
      .ptab {
        flex: 1;
        padding: 10px;
        border: none;
        background: transparent;
        font-size: 0.9rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition:
          color 0.2s,
          border-color 0.2s;
      }
      .ptab.active {
        color: #7c3aed;
        border-bottom-color: #7c3aed;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #374151;
      }
      .text-input {
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        padding: 11px 14px;
        font-size: 0.9rem;
        color: #1f2937;
        background: rgba(255, 255, 255, 0.8);
        outline: none;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
        width: 100%;
        box-sizing: border-box;
      }
      .text-input:focus {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      }
      .text-input:disabled {
        background: #f9fafb;
        color: #9ca3af;
        cursor: not-allowed;
      }
      .input-prefix-wrap {
        display: flex;
        align-items: center;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .input-prefix-wrap:focus-within {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      }
      .prefix {
        padding: 11px 0 11px 14px;
        color: #9ca3af;
        font-weight: 500;
      }
      .no-left-pad {
        border: none !important;
        box-shadow: none !important;
        padding-left: 4px;
        background: transparent;
      }
      .err {
        font-size: 0.78rem;
        color: #ef4444;
      }
      .alert-success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #15803d;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 0.85rem;
      }
      .alert-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 0.85rem;
      }
      .save-btn {
        width: 100%;
        padding: 13px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: opacity 0.2s;
      }
      .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .mini-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      .mini-spinner.white {
        border-color: rgba(255, 255, 255, 0.3);
        border-top-color: white;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .stats-row {
        display: flex;
        gap: 0;
        margin-top: 24px;
        border-top: 1px solid rgba(124, 58, 237, 0.1);
        padding-top: 16px;
      }
      .stat-item {
        flex: 1;
        text-align: center;
      }
      .stat-label {
        display: block;
        font-size: 0.72rem;
        color: #9ca3af;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .stat-val {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  user = this.auth.currentUser;
  activeTab = signal<"profile" | "password">("profile");
  profileSaving = signal(false);
  profileSuccess = signal(false);
  profileError = signal("");
  pwSaving = signal(false);
  pwSuccess = signal(false);
  pwError = signal("");

  statuses: { value: UserStatus; label: string }[] = [
    { value: "ONLINE", label: "Online" },
    { value: "AWAY", label: "Away" },
    { value: "DND", label: "Do Not Disturb" },
    { value: "INVISIBLE", label: "Invisible" },
  ];

  profileForm = this.fb.group({
    fullName: [""],
    username: [""],
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ["", Validators.required],
      newPassword: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private mediaService: MediaService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.getProfile().subscribe((user) => {
      this.profileForm.patchValue({
        fullName: user.fullName,
        username: user.username,
      });
    });
  }

  saveProfile(): void {
    const { fullName, username } = this.profileForm.value;
    this.profileSaving.set(true);
    this.profileSuccess.set(false);
    this.profileError.set("");
    this.auth
      .updateProfile({ fullName: fullName!, username: username! })
      .subscribe({
        next: () => {
          this.profileSaving.set(false);
          this.profileSuccess.set(true);
          setTimeout(() => this.profileSuccess.set(false), 3000);
        },
        error: (err) => {
          this.profileSaving.set(false);
          this.profileError.set(err.error?.message || "Failed to update");
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.pwSaving.set(true);
    this.pwSuccess.set(false);
    this.pwError.set("");
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.auth
      .changePassword({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
      })
      .subscribe({
        next: () => {
          this.pwSaving.set(false);
          this.pwSuccess.set(true);
          this.passwordForm.reset();
          setTimeout(() => this.pwSuccess.set(false), 3000);
        },
        error: (err) => {
          this.pwSaving.set(false);
          this.pwError.set(err.error?.message || "Failed to change password.");
        },
      });
  }

  updateStatus(status: UserStatus): void {
    this.auth.updateStatus(status).subscribe({ error: () => {} });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.mediaService.uploadImage(file, 0).subscribe({
      next: (media) => {
        this.auth.updateProfile({ avatarUrl: media.url }).subscribe({
          next: () => {
            this.auth.currentUser.update((u) =>
              u ? { ...u, avatarUrl: media.url } : null,
            );
            this.profileSuccess.set(true);
            setTimeout(() => this.profileSuccess.set(false), 3000);
          },
          error: () => this.profileError.set("Failed to save avatar"),
        });
      },
      error: () => this.profileError.set("Failed to upload image"),
    });
  }

  avatarPlaceholder(): string {
    const u = this.user();
    if (!u) return "";
    const initial = (u.fullName || u.username || "?").charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="42" cy="42" r="42" fill="#EDE8FF"/><text x="42" y="54" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="30" font-weight="800">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  logout(): void {
    this.auth.logout();
  }

  private passwordMatchValidator(g: any) {
    const p = g.get("newPassword")?.value;
    const c = g.get("confirmPassword")?.value;
    return p === c ? null : { mismatch: true };
  }
}
