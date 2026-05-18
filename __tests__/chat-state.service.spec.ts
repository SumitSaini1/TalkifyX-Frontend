import { TestBed } from '@angular/core/testing';
import { ChatStateService } from '../src/app/core/services/chat-state.service';
import { Message, Room, RoomMember } from '../src/app/core/models';

const makeRoom = (id: number, lastAt?: string): Room => ({
  roomId: id, name: `Room ${id}`, type: 'GROUP', createdById: 1,
  lastMessageAt: lastAt, unreadCount: 0,
});

const makeMsg = (id: string, roomId = 1): Message => ({
  messageId: id, roomId, senderId: 1, content: 'hello', type: 'TEXT',
  isEdited: false, isDeleted: false, deliveryStatus: 'SENT',
  sentAt: new Date().toISOString(),
});

describe('ChatStateService', () => {
  let service: ChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatStateService);
  });

  // ── Rooms ────────────────────────────────────────────────────────────────
  describe('rooms', () => {
    it('setRooms() should populate rooms', () => {
      service.setRooms([makeRoom(1), makeRoom(2)]);
      expect(service.rooms().length).toBe(2);
    });

    it('rooms should sort by lastMessageAt descending', () => {
      service.setRooms([makeRoom(1, '2024-01-01T00:00:00Z'), makeRoom(2, '2024-06-01T00:00:00Z')]);
      expect(service.rooms()[0].roomId).toBe(2);
    });

    it('upsertRoom() should add new room', () => {
      service.upsertRoom(makeRoom(5));
      expect(service.rooms().some((r) => r.roomId === 5)).toBe(true);
    });

    it('upsertRoom() should update existing room name', () => {
      service.setRooms([makeRoom(1)]);
      service.upsertRoom({ ...makeRoom(1), name: 'Updated' });
      expect(service.rooms().find((r) => r.roomId === 1)?.name).toBe('Updated');
    });

    it('removeRoom() should remove by id', () => {
      service.setRooms([makeRoom(1), makeRoom(2)]);
      service.removeRoom(1);
      expect(service.rooms().find((r) => r.roomId === 1)).toBeUndefined();
    });

    it('setActiveRoom() should clear unread', () => {
      service.setRooms([makeRoom(1)]);
      service.incrementUnread(1);
      service.setActiveRoom(1);
      expect(service.activeRoomId()).toBe(1);
      expect(service.getUnread(1)).toBe(0);
    });

    it('getRoom() should return correct room', () => {
      service.setRooms([makeRoom(3)]);
      expect(service.getRoom(3)?.roomId).toBe(3);
    });
  });

  // ── Messages ─────────────────────────────────────────────────────────────
  describe('messages', () => {
    it('setMessages() and getMessages() should work', () => {
      service.setMessages(1, [makeMsg('m1'), makeMsg('m2')]);
      expect(service.getMessages(1).length).toBe(2);
    });

    it('addMessage() should deduplicate', () => {
      service.setMessages(1, [makeMsg('m1')]);
      service.addMessage(1, makeMsg('m1'));
      service.addMessage(1, makeMsg('m2'));
      expect(service.getMessages(1).length).toBe(2);
    });

    it('addMessage() should increment unread for non-active room', () => {
      service.setActiveRoom(2);
      service.addMessage(1, makeMsg('m1'));
      expect(service.getUnread(1)).toBe(1);
    });

    it('addMessage() should NOT increment unread for active room', () => {
      service.setActiveRoom(1);
      service.addMessage(1, makeMsg('m1'));
      expect(service.getUnread(1)).toBe(0);
    });

    it('prependMessages() should prepend', () => {
      service.setMessages(1, [makeMsg('m3')]);
      service.prependMessages(1, [makeMsg('m1'), makeMsg('m2')]);
      expect(service.getMessages(1)[0].messageId).toBe('m1');
    });

    it('updateMessage() should patch fields', () => {
      service.setMessages(1, [makeMsg('m1')]);
      service.updateMessage(1, 'm1', { content: 'edited', isEdited: true });
      const msg = service.getMessages(1)[0];
      expect(msg.content).toBe('edited');
      expect(msg.isEdited).toBe(true);
    });

    it('deleteMessage() should mark as deleted', () => {
      service.setMessages(1, [makeMsg('m1')]);
      service.deleteMessage(1, 'm1');
      const msg = service.getMessages(1)[0];
      expect(msg.isDeleted).toBe(true);
      expect(msg.content).toBe('This message was deleted');
    });

    it('markAllDelivered() should change SENT to DELIVERED', () => {
      service.setMessages(1, [makeMsg('m1')]);
      service.markAllDelivered(1);
      expect(service.getMessages(1)[0].deliveryStatus).toBe('DELIVERED');
    });

    it('markMessagesRead() should mark up to given id as READ', () => {
      service.setMessages(1, [makeMsg('m1'), makeMsg('m2'), makeMsg('m3')]);
      service.markMessagesRead(1, 'm2');
      const result = service.getMessages(1);
      expect(result.find((m) => m.messageId === 'm2')?.deliveryStatus).toBe('READ');
      expect(result.find((m) => m.messageId === 'm3')?.deliveryStatus).toBe('READ');
    });

    it('updateRoomLastMessage() should update room lastMessage', () => {
      service.setRooms([makeRoom(1)]);
      service.updateRoomLastMessage(1, makeMsg('m1'));
      expect(service.getRoom(1)?.lastMessage?.messageId).toBe('m1');
    });
  });

  // ── Members ──────────────────────────────────────────────────────────────
  describe('members', () => {
    it('setMembers() and getMembers() should work', () => {
      const members: RoomMember[] = [{ memberId: 1, roomId: 1, userId: 1, role: 'ADMIN' }];
      service.setMembers(1, members);
      expect(service.getMembers(1).length).toBe(1);
    });

    it('getMembers() should return [] for unknown room', () => {
      expect(service.getMembers(999)).toEqual([]);
    });
  });

  // ── Typing ───────────────────────────────────────────────────────────────
  describe('typing', () => {
    it('setTyping true should add user', () => {
      service.setTyping(1, 5, true);
      expect(service.getTypingUsers(1)).toContain(5);
      expect(service.isAnyoneTyping(1)).toBe(true);
    });

    it('setTyping false should remove user', () => {
      service.setTyping(1, 5, true);
      service.setTyping(1, 5, false);
      expect(service.isAnyoneTyping(1)).toBe(false);
    });
  });

  // ── Presence ─────────────────────────────────────────────────────────────
  describe('presence', () => {
    it('setPresence() and getPresence() should work', () => {
      service.setPresence(1, 'ONLINE');
      expect(service.getPresence(1)).toBe('ONLINE');
    });

    it('getPresence() should return OFFLINE for unknown user', () => {
      expect(service.getPresence(999)).toBe('OFFLINE');
    });

    it('setBulkPresence() should set multiple users', () => {
      service.setBulkPresence([{ userId: 1, status: 'ONLINE' }, { userId: 2, status: 'AWAY' }]);
      expect(service.getPresence(1)).toBe('ONLINE');
      expect(service.getPresence(2)).toBe('AWAY');
    });
  });

  // ── Unread ────────────────────────────────────────────────────────────────
  describe('unread', () => {
    it('incrementUnread() should increment', () => {
      service.incrementUnread(1);
      service.incrementUnread(1);
      expect(service.getUnread(1)).toBe(2);
    });

    it('clearUnread() should reset to 0', () => {
      service.incrementUnread(1);
      service.clearUnread(1);
      expect(service.getUnread(1)).toBe(0);
    });

    it('totalUnread should sum all rooms', () => {
      service.incrementUnread(1);
      service.incrementUnread(1);
      service.incrementUnread(2);
      expect(service.totalUnread()).toBe(3);
    });
  });
});
