import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../src/app/core/services/auth.service';
import { environment } from '../src/environments/environment';

const base      = `${environment.apiBaseUrl}/api/auth`;
const presence  = `${environment.apiBaseUrl}/api/presence`;

const mockUser  = { id: 1, fullName: 'Alice', username: 'alice', email: 'a@a.com', status: 'ONLINE' as any };
const mockToken = 'jwt-token-abc';
const loginRes  = { status: 'ok', message: '', data: { token: mockToken, type: 'Bearer', user: mockUser } };

function seedStorage(withSession = false) {
  localStorage.setItem('talkifyx_token', mockToken);
  localStorage.setItem('talkifyx_user',  JSON.stringify(mockUser));
  if (withSession) localStorage.setItem('talkifyx_session', 'sess-1');
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    router = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: router }],
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  // ── register ────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('POSTs to /api/auth/register', () => {
      const p = { fullName: 'T', username: 't', email: 't@t.com', password: 'p' };
      service.register(p).subscribe();
      http.expectOne(`${base}/register`).flush({ status: 'ok', message: '', data: null });
    });
  });

  // ── login ───────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('saves token to localStorage', () => {
      service.login({ usernameOrEmail: 'alice', password: 'p' }).subscribe();
      http.expectOne(`${base}/login`).flush(loginRes);
      expect(localStorage.getItem('talkifyx_token')).toBe(mockToken);
    });

    it('sets isAuthenticated to true', () => {
      service.login({ usernameOrEmail: 'alice', password: 'p' }).subscribe();
      http.expectOne(`${base}/login`).flush(loginRes);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('sets currentUser signal', () => {
      service.login({ usernameOrEmail: 'alice', password: 'p' }).subscribe();
      http.expectOne(`${base}/login`).flush(loginRes);
      expect(service.currentUser()?.username).toBe('alice');
    });

    it('maps data from ApiResponse wrapper', () => {
      let result: any;
      service.login({ usernameOrEmail: 'u', password: 'p' }).subscribe(r => result = r);
      http.expectOne(`${base}/login`).flush(loginRes);
      expect(result.token).toBe(mockToken);
    });
  });

  // ── logout — with session ───────────────────────────────────────────────
  describe('logout() with sessionId', () => {
    beforeEach(() => seedStorage(true));

    it('POSTs to /api/presence/disconnect with sessionId', () => {
      service.logout();
      const disc = http.expectOne(r => r.url.includes('/presence/disconnect'));
      expect(disc.request.params.get('sessionId')).toBe('sess-1');
      disc.flush(null);
      http.expectOne(r => r.url.includes('/api/auth/status')).flush(null);
      http.expectOne(`${base}/logout`).flush(null);
    });

    it('removes session key from localStorage', () => {
      service.logout();
      http.expectOne(r => r.url.includes('/presence/disconnect')).flush(null);
      http.expectOne(r => r.url.includes('/api/auth/status')).flush(null);
      http.expectOne(`${base}/logout`).flush(null);
      expect(localStorage.getItem('talkifyx_session')).toBeNull();
    });

    it('clears token, sets isAuthenticated false, navigates to /auth/login', () => {
      service.logout();
      http.expectOne(r => r.url.includes('/presence/disconnect')).flush(null);
      http.expectOne(r => r.url.includes('/api/auth/status')).flush(null);
      http.expectOne(`${base}/logout`).flush(null);
      expect(localStorage.getItem('talkifyx_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ── logout — without session ────────────────────────────────────────────
  describe('logout() without sessionId', () => {
    beforeEach(() => seedStorage(false));

    it('does NOT POST to /api/presence/disconnect', () => {
      service.logout();
      http.expectOne(r => r.url.includes('/api/auth/status')).flush(null);
      http.expectOne(`${base}/logout`).flush(null);
      http.expectNone(r => r.url.includes('/presence/disconnect'));
    });

    it('still clears token and navigates', () => {
      service.logout();
      http.expectOne(r => r.url.includes('/api/auth/status')).flush(null);
      http.expectOne(`${base}/logout`).flush(null);
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ── getProfile ──────────────────────────────────────────────────────────
  describe('getProfile()', () => {
    it('GETs /api/auth/profile and updates currentUser signal', () => {
      service.getProfile().subscribe();
      http.expectOne(`${base}/profile`).flush({ status: 'ok', message: '', data: mockUser });
      expect(service.currentUser()?.fullName).toBe('Alice');
    });
  });

  // ── updateProfile ────────────────────────────────────────────────────────
  describe('updateProfile()', () => {
    beforeEach(() => seedStorage());
    it('PUTs to /api/auth/profile and then calls getProfile', () => {
      service.updateProfile({ fullName: 'New' }).subscribe();
      http.expectOne(`${base}/profile`).flush({ status: 'ok', message: '', data: null });
      // getProfile inner call
      http.expectOne(`${base}/profile`).flush({ status: 'ok', message: '', data: mockUser });
    });
  });

  // ── changePassword ───────────────────────────────────────────────────────
  describe('changePassword()', () => {
    it('PUTs to /api/auth/password', () => {
      service.changePassword({ currentPassword: 'old', newPassword: 'new' }).subscribe();
      const r = http.expectOne(`${base}/password`);
      expect(r.request.method).toBe('PUT');
      r.flush({ status: 'ok', message: '', data: null });
    });
  });

  // ── searchUsers ──────────────────────────────────────────────────────────
  describe('searchUsers()', () => {
    it('GETs /api/auth/search with username param and maps data', () => {
      let result: any;
      service.searchUsers('alice').subscribe(r => result = r);
      const r = http.expectOne(req => req.url.includes('/search'));
      expect(r.request.params.get('username')).toBe('alice');
      r.flush({ status: 'ok', message: '', data: [mockUser] });
      expect(result.length).toBe(1);
    });
  });

  // ── updateStatus — with userId ───────────────────────────────────────────
  describe('updateStatus() with userId', () => {
    beforeEach(() => seedStorage());
    it('PUTs presence status and auth status', () => {
      const s = TestBed.inject(AuthService); // re-inject to pick up localStorage
      s.updateStatus('AWAY').subscribe();
      http.expectOne(r => r.url.includes(`/presence/${mockUser.id}/status`)).flush(null);
      http.expectOne(r => r.url.includes('/api/auth/status')).flush({ status: 'ok', message: '', data: null });
    });

    it('updates currentUser status signal', () => {
      const s = TestBed.inject(AuthService);
      s.updateStatus('AWAY').subscribe();
      http.expectOne(r => r.url.includes(`/presence/${mockUser.id}/status`)).flush(null);
      http.expectOne(r => r.url.includes('/api/auth/status')).flush({ status: 'ok', message: '', data: null });
      expect(s.currentUser()?.status).toBe('AWAY');
    });
  });

  // ── updateStatus — without userId (no presence call) ────────────────────
  describe('updateStatus() without userId', () => {
    it('skips presence PUT when no user logged in', () => {
      service.updateStatus('AWAY').subscribe();
      // only auth/status should be called
      http.expectOne(r => r.url.includes('/api/auth/status')).flush({ status: 'ok', message: '', data: null });
      http.expectNone(r => r.url.includes('/presence/'));
    });
  });

  // ── saveSessionId / getSessionId ─────────────────────────────────────────
  describe('saveSessionId() / getSessionId()', () => {
    it('saves and returns session id', () => {
      service.saveSessionId('s-99');
      expect(service.getSessionId()).toBe('s-99');
    });

    it('returns null when not set', () => {
      expect(service.getSessionId()).toBeNull();
    });
  });

  // ── getToken ─────────────────────────────────────────────────────────────
  describe('getToken()', () => {
    it('returns null when nothing stored', () => expect(service.getToken()).toBeNull());
    it('returns stored token', () => { localStorage.setItem('talkifyx_token', 'xyz'); expect(service.getToken()).toBe('xyz'); });
  });

  // ── getUserId ─────────────────────────────────────────────────────────────
  describe('getUserId()', () => {
    it('returns null when no current user', () => expect(service.getUserId()).toBeNull());
    it('returns user id from signal', () => {
      seedStorage();
      expect(TestBed.inject(AuthService).getUserId()).toBe(1);
      http.expectNone(() => true);
    });
  });

  // ── saveToken ─────────────────────────────────────────────────────────────
  describe('saveToken()', () => {
    it('saves token to localStorage', () => {
      service.saveToken('tok-save');
      expect(localStorage.getItem('talkifyx_token')).toBe('tok-save');
    });
  });

  // ── loadUser on construction ──────────────────────────────────────────────
  describe('constructor — loadUser()', () => {
    it('loads user from localStorage on init', () => {
      seedStorage();
      const s = TestBed.inject(AuthService);
      expect(s.currentUser()?.id).toBe(1);
      http.expectNone(() => true);
    });

    it('sets currentUser to null when localStorage empty', () => {
      expect(service.currentUser()).toBeNull();
    });
  });
});
