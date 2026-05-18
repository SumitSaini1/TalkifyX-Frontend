import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomService } from '../src/app/core/services/room.service';
import { environment } from '../src/environments/environment';

describe('RoomService', () => {
  let service: RoomService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/rooms`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RoomService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createRoom() should POST', () => {
    service.createRoom({ name: 'Test', type: 'GROUP' }).subscribe();
    const r = http.expectOne(base);
    expect(r.request.method).toBe('POST');
    r.flush({ roomId: 1, name: 'Test', type: 'GROUP', createdById: 1 });
  });

  it('getRoomById() should GET /:id', () => {
    service.getRoomById(5).subscribe();
    http.expectOne(`${base}/5`).flush({ roomId: 5, name: 'X', type: 'GROUP', createdById: 1 });
  });

  it('getRoomsByUser() should GET /user/:userId', () => {
    service.getRoomsByUser(2).subscribe();
    http.expectOne(`${base}/user/2`).flush([]);
  });

  it('updateRoom() should PUT /:id', () => {
    service.updateRoom(3, { name: 'New' }).subscribe();
    const r = http.expectOne(`${base}/3`);
    expect(r.request.method).toBe('PUT');
    r.flush({});
  });

  it('deleteRoom() should DELETE /:id', () => {
    service.deleteRoom(3).subscribe();
    const r = http.expectOne(`${base}/3`);
    expect(r.request.method).toBe('DELETE');
    r.flush(null);
  });

  it('addMember() should POST with userId param', () => {
    service.addMember(1, 99).subscribe();
    const r = http.expectOne((req) => req.url === `${base}/1/members`);
    expect(r.request.params.get('userId')).toBe('99');
    r.flush({});
  });

  it('removeMember() should DELETE /:id/members/:userId', () => {
    service.removeMember(1, 99).subscribe();
    http.expectOne(`${base}/1/members/99`).flush(null);
  });

  it('getMembers() should GET /:id/members', () => {
    service.getMembers(1).subscribe();
    http.expectOne(`${base}/1/members`).flush([]);
  });

  it('updateMemberRole() should PUT with role param', () => {
    service.updateMemberRole(1, 5, 'ADMIN').subscribe();
    const r = http.expectOne(r => r.url === `${base}/1/members/5/role`);
    expect(r.request.params.get('role')).toBe('ADMIN');
    r.flush({});
  });

  it('muteUnmuteMember() should PUT with mute param', () => {
    service.muteUnmuteMember(1, 5, true).subscribe();
    const r = http.expectOne(r => r.url === `${base}/1/members/5/mute`);
    expect(r.request.params.get('mute')).toBe('true');
    r.flush(null);
  });

  it('updateLastRead() should PUT /:id/read', () => {
    service.updateLastRead(1).subscribe();
    http.expectOne(`${base}/1/read`).flush(null);
  });

  it('getUnreadCount() should GET /:id/unread/:userId', () => {
    service.getUnreadCount(1, 2).subscribe();
    http.expectOne(`${base}/1/unread/2`).flush(5);
  });

  describe('createDM()', () => {
    it('should POST room, add member, then GET full room', () => {
      let result: any;
      service.createDM(1, 2, 'otheruser').subscribe((r) => (result = r));
      http.expectOne(base).flush({ roomId: 10, name: 'DM_1_2', type: 'DM', createdById: 1 });
      http.expectOne((r) => r.url === `${base}/10/members`).flush({ memberId: 1, roomId: 10, userId: 2, role: 'MEMBER' });
      http.expectOne(`${base}/10`).flush({ roomId: 10, name: 'DM_1_2', type: 'DM', createdById: 1 });
      expect(result.roomId).toBe(10);
    });
  });
});
