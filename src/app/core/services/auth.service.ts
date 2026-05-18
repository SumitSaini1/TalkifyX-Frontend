import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap, map } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ApiResponse,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  UserStatus,
} from "../models";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/api/auth`;
  private readonly presenceBase = `${environment.apiBaseUrl}/api/presence`;
  private readonly TOKEN_KEY = "talkifyx_token";
  private readonly USER_KEY = "talkifyx_user";
  private readonly SESSION_KEY = "talkifyx_session";

  currentUser = signal<User | null>(this.loadUser());
  isAuthenticated = signal<boolean>(!!this.getToken());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(req: RegisterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.base}/register`, req);
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/login`, req)
      .pipe(
        map((r) => r.data),
        tap((data) => {
          this.saveToken(data.token);
          this.saveUser(data.user as any);
          this.isAuthenticated.set(true);
          this.currentUser.set(data.user as any);
        }),
      );
  }

  logout(): void {
    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (sessionId) {
      this.http
        .post(`${this.presenceBase}/disconnect`, null, {
          params: { sessionId },
        })
        .subscribe({ error: () => {} });
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.http
      .put(`${this.base}/status`, null, { params: { status: "INVISIBLE" } })
      .subscribe({ error: () => {} });
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(["/auth/login"]);
  }

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.base}/profile`).pipe(
      map((r) => r.data),
      tap((user) => {
        this.saveUser(user);
        this.currentUser.set(user);
      }),
    );
  }

  updateProfile(req: ProfileUpdateRequest): Observable<ApiResponse> {
    return this.http
      .put<ApiResponse>(`${this.base}/profile`, req)
      .pipe(tap(() => this.getProfile().subscribe()));
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.base}/password`, req);
  }

  searchUsers(username: string): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(`${this.base}/search`, { params: { username } })
      .pipe(map((r) => r.data));
  }

  updateStatus(status: UserStatus): Observable<ApiResponse> {
    const userId = this.getUserId();
    if (userId) {
      this.http
        .put(`${this.presenceBase}/${userId}/status`, null, {
          params: { status },
        })
        .subscribe({ error: () => {} });
    }
    return this.http
      .put<ApiResponse>(`${this.base}/status`, null, { params: { status } })
      .pipe(
        tap(() =>
          this.currentUser.update((u) => (u ? { ...u, status } : null)),
        ),
      );
  }

  saveSessionId(sessionId: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionId);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserId(): number | null {
    const u = this.currentUser();
    return u ? u.id : null;
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }
  getSessionId(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }
}
