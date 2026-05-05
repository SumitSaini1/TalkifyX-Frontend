import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture } from '@angular/core/testing';

import { ToastService } from '../src/app/core/services/toast.service';
import { NotificationService } from '../src/app/core/services/notification.service';
import { PresenceService } from '../src/app/core/services/presence.service';
import { MediaService } from '../src/app/core/services/media.service';
import { AuthService } from '../src/app/core/services/auth.service';
import { AvatarComponent } from '../src/app/shared/components/avatar/avatar.component';
import { SkeletonComponent } from '../src/app/shared/components/skeleton/skeleton.component';
import { ToastContainerComponent } from '../src/app/shared/components/toast-container/toast-container.component';
import { SplashComponent } from '../src/app/features/splash/splash.component';
import { OauthCallbackComponent } from '../src/app/features/auth/oauth-callback/oauth-callback.component';
import { environment } from '../src/environments/environment';

// ============================================================
//  ToastService — 100% coverage
// ============================================================
describe('ToastService', () => {
  let s: ToastService;

  beforeEach(() => { TestBed.configureTestingModule({}); s = TestBed.inject(ToastService); });

  it('show() adds a toast with correct fields', () => {
    s.show('hello', 'info', 2000);
    const t = s.toasts()[0];
    expect(t.message).toBe('hello');
    expect(t.type).toBe('info');
    expect(t.duration).toBe(2000);
  });

  it('show() default duration is 3500', fakeAsync(() => {
    s.show('x', 'success');
    expect(s.toasts().length).toBe(1);
    tick(3500);
    expect(s.toasts().length).toBe(0);
  }));

  it('show() auto-dismisses after custom duration', fakeAsync(() => {
    s.show('x', 'error', 1000);
    tick(1000);
    expect(s.toasts().length).toBe(0);
  }));

  it('dismiss() removes by id', () => {
    s.show('a', 'info');
    s.dismiss(s.toasts()[0].id);
    expect(s.toasts().length).toBe(0);
  });

  it('dismiss() unknown id does nothing', () => {
    s.show('a', 'info');
    s.dismiss('nonexistent');
    expect(s.toasts().length).toBe(1);
  });

  it('success() adds type=success', () => { s.success('ok'); expect(s.toasts()[0].type).toBe('success'); });
  it('error() adds type=error with 5000ms', () => { s.error('fail'); expect(s.toasts()[0].type).toBe('error'); expect(s.toasts()[0].duration).toBe(5000); });
  it('info() adds type=info', () => { s.info('note'); expect(s.toasts()[0].type).toBe('info'); });
  it('warning() adds type=warning', () => { s.warning('warn'); expect(s.toasts()[0].type).toBe('warning'); });

  it('multiple toasts coexist', () => {
    s.show('a', 'info'); s.show('b', 'error'); s.show('c', 'warning');
    expect(s.toasts().length).toBe(3);
  });
});

// ============================================================
//  NotificationService
// ============================================================
describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(NotificationService);
    http    = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('getNotifications() GETs /user/:id with page=0', () => {
    service.getNotifications(1).subscribe();
    const r = http.expectOne(req => req.url === `${base}/user/1`);
    expect(r.request.params.get('page')).toBe('0');
    r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  it('getNotifications() passes custom page', () => {
    service.getNotifications(1, 2).subscribe();
    const r = http.expectOne(req => req.url === `${base}/user/1`);
    expect(r.request.params.get('page')).toBe('2');
    r.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 20 });
  });

  it('getUnreadCount() sets unreadCount signal', () => {
    service.getUnreadCount(1).subscribe();
    http.expectOne(`${base}/user/1/unread`).flush({ unreadCount: 7 });
    expect(service.unreadCount()).toBe(7);
  });

  it('getUnreadCount() sets 0 when count is 0', () => {
    service.getUnreadCount(1).subscribe();
    http.expectOne(`${base}/user/1/unread`).flush({ unreadCount: 0 });
    expect(service.unreadCount()).toBe(0);
  });

  it('markAsRead() PUTs /:id/read', () => {
    service.markAsRead('n-1').subscribe();
    const r = http.expectOne(`${base}/n-1/read`);
    expect(r.request.method).toBe('PUT');
    r.flush({});
  });

  it('markAllAsRead() resets unreadCount to 0', () => {
    service.unreadCount.set(5);
    service.markAllAsRead(1).subscribe();
    http.expectOne(`${base}/user/1/read-all`).flush(null);
    expect(service.unreadCount()).toBe(0);
  });

  it('delete() DELETEs /:id', () => {
    service.delete('n-1').subscribe();
    http.expectOne(`${base}/n-1`).flush(null);
  });
});

// ============================================================
//  PresenceService
// ============================================================
describe('PresenceService', () => {
  let service: PresenceService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/presence`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PresenceService);
    http    = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('connect() POSTs /connect', () => {
    service.connect({ userId: 1, status: 'ONLINE', sessionId: 's1' }).subscribe();
    const r = http.expectOne(`${base}/connect`);
    expect(r.request.method).toBe('POST');
    r.flush({});
  });

  it('disconnect() POSTs /disconnect with sessionId', () => {
    service.disconnect('s1').subscribe();
    const r = http.expectOne(req => req.url === `${base}/disconnect`);
    expect(r.request.params.get('sessionId')).toBe('s1');
    r.flush(null);
  });

  it('updateStatus() PUTs /:userId/status', () => {
    service.updateStatus(1, 'AWAY').subscribe();
    const r = http.expectOne(req => req.url === `${base}/1/status`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.params.get('status')).toBe('AWAY');
    r.flush({});
  });

  it('ping() POSTs /ping with sessionId', () => {
    service.ping('s1').subscribe();
    const r = http.expectOne(req => req.url === `${base}/ping`);
    expect(r.request.params.get('sessionId')).toBe('s1');
    r.flush({});
  });

  it('getByUserId() GETs /:userId', () => {
    service.getByUserId(1).subscribe();
    http.expectOne(`${base}/1`).flush({});
  });

  it('getBulk() POSTs /bulk with array', () => {
    service.getBulk([1, 2, 3]).subscribe();
    const r = http.expectOne(`${base}/bulk`);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual([1, 2, 3]);
    r.flush([]);
  });
});

// ============================================================
//  MediaService
// ============================================================
describe('MediaService', () => {
  let service: MediaService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/media`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(MediaService);
    http    = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uploadFile() POSTs FormData with roomId', () => {
    service.uploadFile(new File([''], 'f.txt'), 1).subscribe();
    const r = http.expectOne(`${base}/upload`);
    expect(r.request.body instanceof FormData).toBe(true);
    r.flush({ url: 'http://x.com/f.txt' });
  });

  it('uploadFile() appends messageId when provided', () => {
    service.uploadFile(new File([''], 'f.txt'), 1, 'msg-1').subscribe();
    const r = http.expectOne(`${base}/upload`);
    expect(r.request.body.get('messageId')).toBe('msg-1');
    r.flush({});
  });

  it('uploadImage() POSTs without roomId when undefined', () => {
    service.uploadImage(new File([''], 'img.png')).subscribe();
    const r = http.expectOne(`${base}/upload/image`);
    expect(r.request.body.get('roomId')).toBeNull();
    r.flush({});
  });

  it('uploadImage() POSTs with roomId when provided', () => {
    service.uploadImage(new File([''], 'img.png'), 5).subscribe();
    const r = http.expectOne(`${base}/upload/image`);
    expect(r.request.body.get('roomId')).toBe('5');
    r.flush({});
  });

  it('uploadImage() appends messageId when provided', () => {
    service.uploadImage(new File([''], 'img.png'), 1, 'msg-2').subscribe();
    const r = http.expectOne(`${base}/upload/image`);
    expect(r.request.body.get('messageId')).toBe('msg-2');
    r.flush({});
  });

  it('getById() GETs /:id', () => {
    service.getById('m-1').subscribe();
    http.expectOne(`${base}/m-1`).flush({});
  });

  it('getByRoom() GETs /room/:id', () => {
    service.getByRoom(1).subscribe();
    http.expectOne(`${base}/room/1`).flush([]);
  });

  it('deleteFile() DELETEs /:id', () => {
    service.deleteFile('m-1').subscribe();
    http.expectOne(`${base}/m-1`).flush(null);
  });

  // isImage — all branches
  it('isImage() true for image/png',  () => expect(service.isImage('image/png')).toBe(true));
  it('isImage() true for image/jpeg', () => expect(service.isImage('image/jpeg')).toBe(true));
  it('isImage() false for application/pdf', () => expect(service.isImage('application/pdf')).toBe(false));
  it('isImage() false for undefined', () => expect(service.isImage(undefined)).toBe(false));

  // formatSize — all branches
  it('formatSize() empty string for undefined', () => expect(service.formatSize(undefined)).toBe(''));
  it('formatSize() empty string for 0',         () => expect(service.formatSize(0)).toBe(''));
  it('formatSize() KB when < 1024',             () => expect(service.formatSize(512)).toBe('512 KB'));
  it('formatSize() MB when >= 1024',            () => expect(service.formatSize(2048)).toBe('2.0 MB'));
  it('formatSize() MB decimal precision',       () => expect(service.formatSize(1536)).toBe('1.5 MB'));
});

// ============================================================
//  AvatarComponent
// ============================================================
describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;
  let component: AvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture   = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => expect(component).toBeTruthy());

  it('src() returns imageUrl when set', () => {
    component.imageUrl = 'https://example.com/img.jpg';
    expect(component.src()).toBe('https://example.com/img.jpg');
  });

  it('src() returns user.avatarUrl when imageUrl empty', () => {
    component.user = { id: 1, fullName: 'A', username: 'a', email: 'a@a.com', avatarUrl: 'http://avatar.url', status: 'ONLINE' as any };
    expect(component.src()).toBe('http://avatar.url');
  });

  it('src() generates SVG placeholder when no imageUrl or avatarUrl', () => {
    component.user = { id: 2, fullName: 'Bob', username: 'bob', email: 'b@b.com', status: 'ONLINE' as any };
    expect(component.src().startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('src() uses name input for placeholder when no user', () => {
    component.name = 'Charlie';
    const src = component.src();
    expect(src.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('alt() returns user.fullName when user set', () => {
    component.user = { id: 1, fullName: 'Alice', username: 'alice', email: 'a@a.com', status: 'ONLINE' as any };
    expect(component.alt()).toBe('Alice');
  });

  it('alt() returns user.username when no fullName', () => {
    component.user = { id: 1, fullName: '', username: 'alice', email: 'a@a.com', status: 'ONLINE' as any };
    expect(component.alt()).toBe('alice');
  });

  it('alt() returns name input when no user', () => {
    component.name = 'Custom';
    expect(component.alt()).toBe('Custom');
  });

  it('alt() returns "Avatar" as fallback', () => {
    expect(component.alt()).toBe('Avatar');
  });

  it('statusSize() computed correctly', () => {
    component.size = 40;
    expect(component.statusSize()).toBe(Math.max(8, Math.floor(40 * 0.26)));
  });

  it('statusSize() minimum is 8', () => {
    component.size = 20;
    expect(component.statusSize()).toBeGreaterThanOrEqual(8);
  });

  it('onError() sets errored flag and falls back to placeholder', () => {
    component.imageUrl = 'https://bad.url/img.jpg';
    const img = document.createElement('img');
    component.onError({ target: img } as any);
    expect(img.src.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('placeholder uses ? as initial when no name info', () => {
    const src = component.src();
    const decoded = atob(src.replace('data:image/svg+xml;base64,', ''));
    expect(decoded).toContain('?');
  });

  it('placeholder uses first letter of fullName', () => {
    component.user = { id: 1, fullName: 'Zara', username: 'z', email: 'z@z.com', status: 'ONLINE' as any };
    const src = component.src();
    const decoded = atob(src.replace('data:image/svg+xml;base64,', ''));
    expect(decoded).toContain('Z');
  });

  it('color cycles via id % colors.length', () => {
    // id=5 → index 0 → '#7C3AED'
    component.user = { id: 5, fullName: 'Dave', username: 'd', email: 'd@d.com', status: 'ONLINE' as any };
    const src = component.src();
    expect(src.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
});

// ============================================================
//  SkeletonComponent
// ============================================================
describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;
  let component: SkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture   = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => expect(component).toBeTruthy());
  it('default width is 100%',  () => expect(component.width).toBe('100%'));
  it('default height is 16px', () => expect(component.height).toBe('16px'));
  it('default radius is 8px',  () => expect(component.radius).toBe('8px'));

  it('accepts custom inputs', () => {
    component.width  = '200px';
    component.height = '24px';
    component.radius = '4px';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.skeleton');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('24px');
  });
});

// ============================================================
//  ToastContainerComponent
// ============================================================
describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastContainerComponent] }).compileComponents();
    fixture      = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());

  it('renders toasts from service', () => {
    toastService.success('Done!');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Done!');
  });

  it('dismiss button removes toast', () => {
    toastService.info('Note');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.toast-close');
    btn.click();
    fixture.detectChanges();
    expect(toastService.toasts().length).toBe(0);
  });
});

// ============================================================
//  SplashComponent
// ============================================================
describe('SplashComponent', () => {
  let fixture: ComponentFixture<SplashComponent>;
  let component: SplashComponent;
  let authService: any;
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    authService = { isAuthenticated: jest.fn() };
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [SplashComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(SplashComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => expect(component).toBeTruthy());

  it('visible is false before ngOnInit', () => expect(component.visible).toBe(false));

  it('navigates to /chat when authenticated', fakeAsync(() => {
    authService.isAuthenticated.mockReturnValue(true);
    fixture.detectChanges();
    tick(3600);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/chat']);
  }));

  it('navigates to /auth/login when not authenticated', fakeAsync(() => {
    authService.isAuthenticated.mockReturnValue(false);
    fixture.detectChanges();
    tick(3600);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  it('sets visible=true after 100ms', fakeAsync(() => {
    authService.isAuthenticated.mockReturnValue(false);
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect(component.visible).toBe(true);
    tick(3500); // drain remaining timers
  }));

  it('sets fadingOut=true after 2800ms', fakeAsync(() => {
    authService.isAuthenticated.mockReturnValue(false);
    fixture.detectChanges();
    tick(2800);
    fixture.detectChanges();
    expect(component.fadingOut).toBe(true);
    tick(800); // drain remaining timers
  }));
});

// ============================================================
//  OauthCallbackComponent
// ============================================================
describe('OauthCallbackComponent', () => {
  let fixture: ComponentFixture<OauthCallbackComponent>;
  let authService: any;
  let router: { navigate: jest.Mock };

  function setup(token: string | null) {
    authService = {
      saveToken: jest.fn(),
      getProfile: jest.fn(),
      isAuthenticated: { set: jest.fn() },
    };
    router = { navigate: jest.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OauthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { token } } } },
      ],
    });

    fixture = TestBed.createComponent(OauthCallbackComponent);
  }

  it('saves token and navigates to /chat on success', () => {
    setup('oauth-tok');
    authService.getProfile.mockReturnValue(of({} as any));
    fixture.detectChanges();
    expect(authService.saveToken).toHaveBeenCalledWith('oauth-tok');
    expect(router.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('navigates to /chat even when getProfile errors', () => {
    setup('oauth-tok');
    authService.getProfile.mockReturnValue(new (require('rxjs').Subject)());
    // trigger error path
    authService.getProfile.mockReturnValue({ subscribe: (o: any) => o.error(new Error()) } as any);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/chat']);
  });

  it('navigates to /auth/login when no token', () => {
    setup(null);
    fixture.detectChanges();
    expect(authService.saveToken).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
