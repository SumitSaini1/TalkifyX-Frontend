import { TestBed } from '@angular/core/testing';
import { WebSocketService } from '../src/app/core/services/websocket.service';
import { AuthService } from '../src/app/core/services/auth.service';

class MockClient {
  active = false;
  onConnect:    (() => void)       | undefined;
  onDisconnect: (() => void)       | undefined;
  onStompError: ((f: any) => void) | undefined;
  connectHeaders: any;
  reconnectDelay: any;
  webSocketFactory: any;

  private _subs = new Map<string, (msg: any) => void>();

  activate()   { this.active = true;  this.onConnect?.(); }
  deactivate() { this.active = false; this.onDisconnect?.(); }

  subscribe(dest: string, cb: (msg: any) => void) {
    this._subs.set(dest, cb);
    return { unsubscribe: () => this._subs.delete(dest) };
  }

  publish = jest.fn();

  trigger(dest: string, body: object) {
    this._subs.get(dest)?.({ body: JSON.stringify(body) });
  }
}

describe('WebSocketService', () => {
  let service:    WebSocketService;
  let mockClient: MockClient;
  let authService: any;

  const fire = (body: object) =>
    (service as any).handleRoomMessage({ body: JSON.stringify(body) });

  beforeEach(() => {
    authService = {
      getUserId:   jest.fn().mockReturnValue(1),
      getToken:    jest.fn().mockReturnValue('tok'),
      currentUser: jest.fn().mockReturnValue({ id: 1, fullName: 'Alice', avatarUrl: null }),
    };

    TestBed.configureTestingModule({
      providers: [WebSocketService, { provide: AuthService, useValue: authService }],
    });

    service    = TestBed.inject(WebSocketService);
    mockClient = new MockClient();
    (service as any).client = mockClient;
  });

  it('isConnected() returns false initially', () => expect(service.isConnected()).toBe(false));

  it('connect() skips if already connected', () => {
    (service as any).connected = true;
    service.connect();
    expect(mockClient.active).toBe(false);
  });

  it('connect() skips if no userId', () => {
    authService.getUserId.mockReturnValue(null);
    service.connect();
    expect(mockClient.active).toBe(false);
  });

  it('ngOnDestroy() calls disconnect()', () => {
    const spy = jest.spyOn(service, 'disconnect');
    service.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('disconnect() clears subscriptions and sets connected=false', () => {
    (service as any).connected = true;
    mockClient.active = true;
    service.disconnect();
    expect(service.isConnected()).toBe(false);
    expect((service as any).roomSubscriptions.size).toBe(0);
    expect((service as any).subscriptions.size).toBe(0);
  });

  it('disconnect() handles inactive client gracefully', () => {
    (service as any).connected = true;
    mockClient.active = false;
    expect(() => service.disconnect()).not.toThrow();
  });

  describe('send methods blocked when disconnected', () => {
    beforeEach(() => { (service as any).connected = false; mockClient.publish.mockClear(); });

    it('sendMessage() blocked',     () => { service.sendMessage({} as any);     expect(mockClient.publish).not.toHaveBeenCalled(); });
    it('sendTyping() blocked',      () => { service.sendTyping({} as any);      expect(mockClient.publish).not.toHaveBeenCalled(); });
    it('sendEdit() blocked',        () => { service.sendEdit({} as any);        expect(mockClient.publish).not.toHaveBeenCalled(); });
    it('sendDelete() blocked',      () => { service.sendDelete({} as any);      expect(mockClient.publish).not.toHaveBeenCalled(); });
    it('sendReadReceipt() blocked', () => { service.sendReadReceipt({} as any); expect(mockClient.publish).not.toHaveBeenCalled(); });
    it('sendReact() blocked',       () => { service.sendReact({} as any);       expect(mockClient.publish).not.toHaveBeenCalled(); });
  });

  describe('send methods publish when connected', () => {
    beforeEach(() => { (service as any).connected = true; mockClient.publish.mockClear(); });

    it('sendMessage() → /app/chat.send with senderName', () => {
      service.sendMessage({ type: 'CHAT_MESSAGE', roomId: 1, content: 'hi' } as any);
      const call = mockClient.publish.mock.calls[0][0];
      expect(call.destination).toBe('/app/chat.send');
      expect(JSON.parse(call.body).senderName).toBe('Alice');
    });

    it('sendTyping() → /app/chat.typing',    () => { service.sendTyping({} as any);      expect(mockClient.publish.mock.calls[0][0].destination).toBe('/app/chat.typing'); });
    it('sendEdit() → /app/chat.edit',        () => { service.sendEdit({} as any);        expect(mockClient.publish.mock.calls[0][0].destination).toBe('/app/chat.edit'); });
    it('sendDelete() → /app/chat.delete',    () => { service.sendDelete({} as any);      expect(mockClient.publish.mock.calls[0][0].destination).toBe('/app/chat.delete'); });
    it('sendReadReceipt() → /app/chat.read', () => { service.sendReadReceipt({} as any); expect(mockClient.publish.mock.calls[0][0].destination).toBe('/app/chat.read'); });
    it('sendReact() → /app/chat.react',      () => { service.sendReact({} as any);       expect(mockClient.publish.mock.calls[0][0].destination).toBe('/app/chat.react'); });
  });

  describe('handleRoomMessage() event routing', () => {
    it('eventType=NEW_ROOM → NEW_ROOM',         (done) => { service.events.subscribe(e => { if (e.kind === 'NEW_ROOM')      done(); }); fire({ eventType: 'NEW_ROOM' }); });
    it('eventType=ROOM_UPDATED → ROOM_UPDATED', (done) => { service.events.subscribe(e => { if (e.kind === 'ROOM_UPDATED') done(); }); fire({ eventType: 'ROOM_UPDATED' }); });
    it('eventType=MESSAGE → MESSAGE',           (done) => { service.events.subscribe(e => { if (e.kind === 'MESSAGE')      done(); }); fire({ eventType: 'MESSAGE', messageId: 'm1' }); });
    it('type=READ_RECEIPT → READ',              (done) => { service.events.subscribe(e => { if (e.kind === 'READ')         done(); }); fire({ type: 'READ_RECEIPT' }); });
    it('readerId present → READ',               (done) => { service.events.subscribe(e => { if (e.kind === 'READ')         done(); }); fire({ readerId: 1, roomId: 1 }); });
    it('type=MESSAGE_EDIT → MSG_EDIT',          (done) => { service.events.subscribe(e => { if (e.kind === 'MSG_EDIT')     done(); }); fire({ type: 'MESSAGE_EDIT' }); });
    it('type=MESSAGE_DELETE → MSG_DELETE',      (done) => { service.events.subscribe(e => { if (e.kind === 'MSG_DELETE')   done(); }); fire({ type: 'MESSAGE_DELETE' }); });
    it('type=REACTION → REACTION',              (done) => { service.events.subscribe(e => { if (e.kind === 'REACTION')     done(); }); fire({ type: 'REACTION' }); });
    it('eventType=REACTION → REACTION',         (done) => { service.events.subscribe(e => { if (e.kind === 'REACTION')     done(); }); fire({ eventType: 'REACTION' }); });
    it('isTyping → TYPING',                     (done) => { service.events.subscribe(e => { if (e.kind === 'TYPING')       done(); }); fire({ isTyping: true, senderId: 1, roomId: 1 }); });
    it('senderId+roomId only → TYPING',         (done) => { service.events.subscribe(e => { if (e.kind === 'TYPING')       done(); }); fire({ senderId: 1, roomId: 1 }); });
    it('malformed JSON does not throw', () => { expect(() => (service as any).handleRoomMessage({ body: '{not json' })).not.toThrow(); });
    it('unknown shape emits nothing', () => { let count = 0; service.events.subscribe(() => count++); fire({ someRandom: true }); expect(count).toBe(0); });
  });

  describe('subscribeToRoom()', () => {
    it('deduplicates subscriptions for same roomId', () => {
      (service as any).connected = true;
      jest.spyOn(mockClient, 'subscribe' as any);
      service.subscribeToRoom(5);
      service.subscribeToRoom(5);
      expect((mockClient.subscribe as jest.Mock).mock.calls.length).toBe(1);
    });

    it('unsubscribeFromRoom() removes subscription', () => {
      (service as any).connected = true;
      jest.spyOn(mockClient, 'subscribe' as any);
      service.subscribeToRoom(5);
      service.unsubscribeFromRoom(5);
      expect((service as any).roomSubscriptions.has(5)).toBe(false);
    });

    it('unsubscribeFromRoom() does nothing for unknown roomId', () => {
      expect(() => service.unsubscribeFromRoom(999)).not.toThrow();
    });
  });

  it('CONNECTED event emitted manually', (done) => {
    service.events.subscribe(e => { if (e.kind === 'CONNECTED') done(); });
    (service as any).events$.next({ kind: 'CONNECTED' });
  });

  it('DISCONNECTED event emitted manually', (done) => {
    service.events.subscribe(e => { if (e.kind === 'DISCONNECTED') done(); });
    (service as any).events$.next({ kind: 'DISCONNECTED' });
  });

  it('presence subscription emits PRESENCE event', (done) => {
    (service as any).connected = true;
    service.events.subscribe(e => { if (e.kind === 'PRESENCE') done(); });
    (service as any).subscribeToPresence();
    mockClient.trigger('/topic/presence', { userId: 1, status: 'ONLINE' });
  });
});
