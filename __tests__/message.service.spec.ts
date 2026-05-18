import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessageService } from '../src/app/core/services/message.service';
import { environment } from '../src/environments/environment';

describe('MessageService', () => {
  let service: MessageService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/messages`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(MessageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sendMessage() should POST', () => {
    const req = { roomId: 1, content: 'hi', type: 'TEXT' as const };
    service.sendMessage(req).subscribe();
    const r = http.expectOne(base);
    expect(r.request.method).toBe('POST');
    r.flush({});
  });

  it('getMessagesByRoom() should GET with page and size', () => {
    service.getMessagesByRoom(1, 0, 20).subscribe();
    const r = http.expectOne((req) => req.url === `${base}/room/1`);
    expect(r.request.params.get('page')).toBe('0');
    expect(r.request.params.get('size')).toBe('20');
    r.flush({ content: [], totalPages: 0, totalElements: 0, size: 20, number: 0, first: true, last: true });
  });

  it('getMessagesBefore() should GET /before with before param', () => {
    service.getMessagesBefore(1, '2024-01-01T00:00:00Z').subscribe();
    const r = http.expectOne((req) => req.url === `${base}/room/1/before`);
    expect(r.request.params.get('before')).toBe('2024-01-01T00:00:00Z');
    r.flush([]);
  });

  it('editMessage() should PUT with content param', () => {
    service.editMessage('msg-1', 'new content').subscribe();
    const r = http.expectOne(r => r.url === `${base}/msg-1`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.params.get('content')).toBe('new content');
    r.flush({});
  });

  it('deleteMessage() should DELETE with type=EVERYONE by default', () => {
    service.deleteMessage('msg-1').subscribe();
    const r = http.expectOne(r => r.url === `${base}/msg-1`);
    expect(r.request.params.get('type')).toBe('EVERYONE');
    r.flush(null);
  });

  it('deleteMessage() should support type=ME', () => {
    service.deleteMessage('msg-1', 'ME').subscribe();
    http.expectOne(r => r.url === `${base}/msg-1`).flush(null);
  });

  it('searchMessages() should GET /search with keyword', () => {
    service.searchMessages(1, 'hello').subscribe();
    const r = http.expectOne((req) => req.url === `${base}/room/1/search`);
    expect(r.request.params.get('keyword')).toBe('hello');
    r.flush([]);
  });

  it('getMessageCount() should GET /count', () => {
    service.getMessageCount(1).subscribe();
    http.expectOne(`${base}/room/1/count`).flush(42);
  });

  it('getUnreadMessages() should GET /unread with after param', () => {
    service.getUnreadMessages(1, '2024-01-01T00:00:00Z').subscribe();
    const r = http.expectOne((req) => req.url === `${base}/room/1/unread`);
    expect(r.request.params.get('after')).toBe('2024-01-01T00:00:00Z');
    r.flush(3);
  });

  it('updateDeliveryStatus() should PUT /:id/status', () => {
    service.updateDeliveryStatus('msg-1', 'READ').subscribe();
    const r = http.expectOne(r => r.url === `${base}/msg-1/status`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.params.get('status')).toBe('READ');
    r.flush(null);
  });
});
