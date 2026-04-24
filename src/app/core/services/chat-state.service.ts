import { Injectable, signal, computed } from '@angular/core';
import { Room, Message, User, RoomMember } from '../models';

interface ChatState {
  activeRoomId: number | null;
  rooms: Room[];
  // messages keyed by roomId
  messageMap: Map<number, Message[]>;
  memberMap: Map<number, RoomMember[]>;
  typingMap: Map<number, Set<number>>;   // roomId -> set of typing userIds
  presenceMap: Map<number, string>;      // userId -> status
  unreadMap: Map<number, number>;        // roomId -> count
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  // ── State signals ──────────────────────────────────────────────────────
  private _state = signal<ChatState>({
    activeRoomId: null,
    rooms: [],
    messageMap: new Map(),
    memberMap: new Map(),
    typingMap: new Map(),
    presenceMap: new Map(),
    unreadMap: new Map(),
  });

  // ── Read-only computed slices ──────────────────────────────────────────
  activeRoomId = computed(() => this._state().activeRoomId);

  rooms = computed(() =>
    [...this._state().rooms].sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    })
  );

  totalUnread = computed(() => {
    let count = 0;
    this._state().unreadMap.forEach(v => (count += v));
    return count;
  });

  // ── Rooms ──────────────────────────────────────────────────────────────
  setRooms(rooms: Room[]): void {
    this._state.update(s => ({
      ...s,
      rooms,
      unreadMap: new Map(rooms.map(r => [r.roomId, r.unreadCount ?? 0])),
    }));
  }

  upsertRoom(room: Room): void {
    this._state.update(s => {
      const idx = s.rooms.findIndex(r => r.roomId === room.roomId);
      const rooms = idx >= 0
        ? s.rooms.map(r => (r.roomId === room.roomId ? { ...r, ...room } : r))
        : [room, ...s.rooms];
      return { ...s, rooms };
    });
  }

  removeRoom(roomId: number): void {
    this._state.update(s => ({
      ...s,
      rooms: s.rooms.filter(r => r.roomId !== roomId),
    }));
  }

  setActiveRoom(roomId: number | null): void {
    this._state.update(s => ({ ...s, activeRoomId: roomId }));
    if (roomId !== null) this.clearUnread(roomId);
  }

  getRoom(roomId: number): Room | undefined {
    return this._state().rooms.find(r => r.roomId === roomId);
  }

  updateRoomLastMessage(roomId: number, msg: Message): void {
    this._state.update(s => ({
      ...s,
      rooms: s.rooms.map(r =>
        r.roomId === roomId
          ? { ...r, lastMessage: msg, lastMessageAt: msg.sentAt }
          : r
      ),
    }));
  }

  // ── Messages ───────────────────────────────────────────────────────────
  getMessages(roomId: number): Message[] {
    return this._state().messageMap.get(roomId) ?? [];
  }

  setMessages(roomId: number, messages: Message[]): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      map.set(roomId, messages);
      return { ...s, messageMap: map };
    });
  }

  prependMessages(roomId: number, messages: Message[]): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      const existing = map.get(roomId) ?? [];
      map.set(roomId, [...messages, ...existing]);
      return { ...s, messageMap: map };
    });
  }

  addMessage(roomId: number, msg: Message): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      const existing = map.get(roomId) ?? [];
      // Deduplicate by messageId
      if (existing.some(m => m.messageId === msg.messageId)) return s;
      map.set(roomId, [...existing, msg]);
      return { ...s, messageMap: map };
    });
    this.updateRoomLastMessage(roomId, msg);
    if (this._state().activeRoomId !== roomId) {
      this.incrementUnread(roomId);
    }
  }

  updateMessage(roomId: number, messageId: string, patch: Partial<Message>): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      const msgs = (map.get(roomId) ?? []).map(m =>
        m.messageId === messageId ? { ...m, ...patch } : m
      );
      map.set(roomId, msgs);
      return { ...s, messageMap: map };
    });
  }

  deleteMessage(roomId: number, messageId: string): void {
    this.updateMessage(roomId, messageId, {
      isDeleted: true,
      content: 'This message was deleted',
    });
  }

  markAllDelivered(roomId: number): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      const msgs = (map.get(roomId) ?? []).map(m =>
        m.deliveryStatus === 'SENT' ? { ...m, deliveryStatus: 'DELIVERED' as any } : m
      );
      map.set(roomId, msgs);
      return { ...s, messageMap: map };
    });
  }

  markMessagesRead(roomId: number, upToMessageId: string): void {
    this._state.update(s => {
      const map = new Map(s.messageMap);
      const msgs = map.get(roomId) ?? [];
      let reached = false;
      const updated = [...msgs].reverse().map(m => {
        if (m.messageId === upToMessageId) reached = true;
        if (reached) return { ...m, deliveryStatus: 'READ' as any };
        return m;
      }).reverse();
      map.set(roomId, updated);
      return { ...s, messageMap: map };
    });
  }

  // ── Members ────────────────────────────────────────────────────────────
  setMembers(roomId: number, members: RoomMember[]): void {
    this._state.update(s => {
      const map = new Map(s.memberMap);
      map.set(roomId, members);
      return { ...s, memberMap: map };
    });
  }

  getMembers(roomId: number): RoomMember[] {
    return this._state().memberMap.get(roomId) ?? [];
  }

  // ── Typing ─────────────────────────────────────────────────────────────
  setTyping(roomId: number, userId: number, isTyping: boolean): void {
    this._state.update(s => {
      const map = new Map(s.typingMap);
      const set = new Set(map.get(roomId) ?? []);
      isTyping ? set.add(userId) : set.delete(userId);
      map.set(roomId, set);
      return { ...s, typingMap: map };
    });
  }

  getTypingUsers(roomId: number): number[] {
    return Array.from(this._state().typingMap.get(roomId) ?? []);
  }

  isAnyoneTyping(roomId: number): boolean {
    return (this._state().typingMap.get(roomId)?.size ?? 0) > 0;
  }

  // ── Presence ───────────────────────────────────────────────────────────
  setPresence(userId: number, status: string): void {
    this._state.update(s => {
      const map = new Map(s.presenceMap);
      map.set(userId, status);
      return { ...s, presenceMap: map };
    });
  }

  setBulkPresence(entries: { userId: number; status: string }[]): void {
    this._state.update(s => {
      const map = new Map(s.presenceMap);
      entries.forEach(e => map.set(e.userId, e.status));
      return { ...s, presenceMap: map };
    });
  }

  getPresence(userId: number): string {
    return this._state().presenceMap.get(userId) ?? 'OFFLINE';
  }

  // ── Unread ─────────────────────────────────────────────────────────────
  incrementUnread(roomId: number): void {
    this._state.update(s => {
      const map = new Map(s.unreadMap);
      map.set(roomId, (map.get(roomId) ?? 0) + 1);
      return { ...s, unreadMap: map };
    });
  }

  clearUnread(roomId: number): void {
    this._state.update(s => {
      const map = new Map(s.unreadMap);
      map.set(roomId, 0);
      return { ...s, unreadMap: map };
    });
  }

  getUnread(roomId: number): number {
    return this._state().unreadMap.get(roomId) ?? 0;
  }
}
