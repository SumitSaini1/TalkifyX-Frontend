import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { Room, User } from "../../../core/models";
import { AuthService } from "../../../core/services/auth.service";
import { NotificationService } from "../../../core/services/notification.service";
import { PresenceService } from "../../../core/services/presence.service";
import { RoomService } from "../../../core/services/room.service";
import { WebSocketService } from "../../../core/services/websocket.service";
import { NotificationsPanelComponent } from "../../notifications/notifications-panel.component";
import { NewChatModalComponent } from "../new-chat-modal/new-chat-modal.component";
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  HostListener,
} from "@angular/core";

@Component({
  selector: "app-chat-shell",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    NewChatModalComponent,
    NotificationsPanelComponent,
  ],
  template: `
    <div class="shell">
      <aside class="sidebar glass" [class.mobile-hidden]="showMobileChat()">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="url(#sh1)" />
                <path d="M6 10.5c0-1.5 1.2-2.7 2.7-2.7H23.3C24.8 7.8 26 9 26 10.5V18c0 1.5-1.2 2.7-2.7 2.7H18l-4 2.8v-2.8H8.7C7.2 20.7 6 19.5 6 18V10.5z" fill="white"/>
                <defs>
                  <linearGradient id="sh1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#7C3AED"/><stop offset="1" stop-color="#A855F7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span class="brand-name">TalkifyX</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn" (click)="showNotifications.set(!showNotifications())" title="Notifications">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>
              @if(notifService.unreadCount() > 0) {
                <span class="badge">{{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}</span>
              }
            </button>
            <button class="icon-btn" (click)="showNewChat.set(true)" title="New Chat">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            </button>
          </div>
        </div>

        <div class="user-info" [routerLink]="['/profile']">
          <div class="avatar-wrap">
            <img [src]="me()?.avatarUrl || avatarPlaceholder(me())" class="avatar" [alt]="me()?.fullName"/>
            <span class="status-dot" [class]="'status-' + (me()?.status || 'ONLINE').toLowerCase()"></span>
          </div>
          <div class="user-text">
            <span class="user-name">{{ me()?.fullName }}</span>
            <span class="user-username">&#64;{{ me()?.username }}</span>
          </div>
          <svg viewBox="0 0 20 20" fill="currentColor" class="chevron"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
        </div>

        <div class="search-box">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
          <input [(ngModel)]="searchQuery" placeholder="Search chats..." (input)="onSearch()"/>
          @if(searchQuery) {
            <button class="clear-search" (click)="searchQuery=''; loadRooms()">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </button>
          }
        </div>

        <div class="room-list">
          @if(loading()) {
            @for(i of [1,2,3,4,5]; track i) {
              <div class="room-item skeleton">
                <div class="sk-avatar"></div>
                <div class="sk-content">
                  <div class="sk-line short"></div>
                  <div class="sk-line long"></div>
                </div>
              </div>
            }
          } @else if(filteredRooms().length === 0) {
            <div class="empty-state">
              <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#F3F0FF"/><path d="M20 26c0-1.5 1.2-2.7 2.7-2.7H41.3C42.8 23.3 44 24.5 44 26V36c0 1.5-1.2 2.7-2.7 2.7H36l-5 3.5v-3.5H22.7C21.2 38.7 20 37.5 20 36V26z" fill="#7C3AED" opacity=".3"/></svg>
              <p>{{ searchQuery ? 'No chats found' : 'No chats yet' }}</p>
              <button class="start-btn" (click)="showNewChat.set(true)">Start a conversation</button>
            </div>
          } @else {
            @for(room of filteredRooms(); track room.roomId) {
              <div class="room-item" [class.active]="activeRoomId() === room.roomId" (click)="openRoom(room)">
                <div class="avatar-wrap">
                  <img [src]="getRoomAvatar(room)" class="avatar" [alt]="getRoomName(room)"/>
                  @if(room.type === 'DM' && room.otherUser) {
                    <span class="status-dot" [class]="'status-' + getPresenceStatus(room.otherUser.id)"></span>
                  }
                </div>
                <div class="room-info">
                  <div class="room-top">
                    <span class="room-name">{{ getRoomName(room) }}</span>
                    <span class="room-time">{{ formatTime(room.lastMessageAt) }}</span>
                  </div>
                  <div class="room-bottom">
                    <span class="room-last">
                      @if(typingRooms().has(room.roomId)) {
                        <span class="typing-txt">typing...</span>
                      } @else {
                        {{ room.lastMessage?.content || (room.lastMessage?.type === 'IMAGE' ? '📷 Photo' : room.lastMessage?.type === 'FILE' ? '📎 File' : 'No messages yet') }}
                      }
                    </span>
                    @if(room.unreadCount && room.unreadCount > 0) {
                      <span class="unread-badge">{{ room.unreadCount > 99 ? '99+' : room.unreadCount }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </aside>

      <main class="main-area" [class.mobile-visible]="showMobileChat()">
        <router-outlet (activate)="onRouteActivate()"/>
        @if(!hasActiveRoom()) {
          <div class="no-chat-selected">
            <div class="no-chat-content">
              <div class="no-chat-icon">
                <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#F3F0FF"/><path d="M18 28c0-3 2.4-5.5 5.5-5.5H56.5C59.6 22.5 62 25 62 28V46c0 3-2.4 5.5-5.5 5.5H46l-8 6V51.5H23.5C20.4 51.5 18 49 18 46V28z" fill="#7C3AED" opacity=".15"/><path d="M22 32c0-2.2 1.8-4 4-4H54c2.2 0 4 1.8 4 4V44c0 2.2-1.8 4-4 4H46l-6 4.5V48H26c-2.2 0-4-1.8-4-4V32z" fill="#7C3AED" opacity=".3"/><circle cx="33" cy="38" r="2" fill="#7C3AED"/><circle cx="40" cy="38" r="2" fill="#7C3AED"/><circle cx="47" cy="38" r="2" fill="#7C3AED"/></svg>
              </div>
              <h2>Welcome to TalkifyX</h2>
              <p>Select a conversation to start chatting, or create a new one.</p>
              <button class="start-btn-main" (click)="showNewChat.set(true)">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
                New Conversation
              </button>
            </div>
          </div>
        }
      </main>
    </div>

    @if(showNewChat()) {
      <app-new-chat-modal [existingRooms]="rooms()" (close)="showNewChat.set(false)" (roomCreated)="onRoomCreated($event)"/>
    }
    @if(showNotifications()) {
      <app-notifications-panel (close)="showNotifications.set(false)"/>
    }
  `,
  styles: [`
    .shell { height: 100vh; display: flex; overflow: hidden; background: linear-gradient(135deg, #f8f4ff 0%, #ede8ff 100%); }
    .sidebar { width: 360px; min-width: 360px; height: 100vh; display: flex; flex-direction: column; border-right: 1px solid rgba(124,58,237,0.1); background: rgba(255,255,255,0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
    .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 36px; height: 36px; }
    .brand-icon svg { width: 100%; height: 100%; }
    .brand-name { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .header-actions { display: flex; gap: 6px; }
    .icon-btn { width: 38px; height: 38px; border-radius: 10px; border: none; background: rgba(124,58,237,0.08); color: #7c3aed; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; position: relative; }
    .icon-btn:hover { background: rgba(124,58,237,0.15); }
    .icon-btn svg { width: 18px; height: 18px; }
    .badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 9px; font-size: 0.65rem; font-weight: 700; padding: 1px 5px; min-width: 16px; text-align: center; border: 2px solid white; }
    .user-info { display: flex; align-items: center; gap: 12px; padding: 12px 20px; cursor: pointer; border-radius: 12px; margin: 0 12px; transition: background 0.2s; }
    .user-info:hover { background: rgba(124,58,237,0.06); }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(124,58,237,0.2); }
    .status-dot { position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; }
    .status-online { background: #10b981; }
    .status-away { background: #f59e0b; }
    .status-dnd { background: #ef4444; }
    .status-invisible, .status-offline { background: #9ca3af; }
    .user-text { flex: 1; min-width: 0; }
    .user-name { display: block; font-weight: 600; font-size: 0.9rem; color: #1f2937; }
    .user-username { display: block; font-size: 0.78rem; color: #9ca3af; }
    .chevron { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .search-box { display: flex; align-items: center; gap: 8px; margin: 8px 12px 4px; padding: 0 14px; background: rgba(124,58,237,0.06); border-radius: 12px; border: 1.5px solid transparent; transition: border-color 0.2s; }
    .search-box:focus-within { border-color: rgba(124,58,237,0.3); background: white; }
    .search-box svg { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .search-box input { flex: 1; border: none; background: transparent; padding: 10px 0; font-size: 0.9rem; color: #374151; outline: none; }
    .search-box input::placeholder { color: #9ca3af; }
    .clear-search { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; }
    .clear-search svg { width: 14px; height: 14px; }
    .room-list { flex: 1; overflow-y: auto; padding: 8px; }
    .room-list::-webkit-scrollbar { width: 4px; }
    .room-list::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 2px; }
    .room-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; cursor: pointer; transition: background 0.15s; margin-bottom: 2px; }
    .room-item:hover { background: rgba(124,58,237,0.06); }
    .room-item.active { background: rgba(124,58,237,0.1); }
    .room-item .avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(124,58,237,0.15); }
    .room-info { flex: 1; min-width: 0; }
    .room-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
    .room-name { font-weight: 600; font-size: 0.9rem; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
    .room-time { font-size: 0.72rem; color: #9ca3af; flex-shrink: 0; }
    .room-bottom { display: flex; justify-content: space-between; align-items: center; }
    .room-last { font-size: 0.82rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .typing-txt { color: #7c3aed; font-style: italic; }
    .unread-badge { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; border-radius: 9px; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; min-width: 18px; text-align: center; flex-shrink: 0; }
    .skeleton { pointer-events: none; }
    .sk-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(90deg, #f0e6ff 25%, #e8d8ff 50%, #f0e6ff 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .sk-content { flex: 1; }
    .sk-line { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #f0e6ff 25%, #e8d8ff 50%, #f0e6ff 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 8px; }
    .sk-line.short { width: 40%; }
    .sk-line.long { width: 75%; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 12px; }
    .empty-state svg { width: 64px; height: 64px; }
    .empty-state p { color: #9ca3af; font-size: 0.9rem; text-align: center; }
    .start-btn { padding: 8px 16px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .main-area { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .no-chat-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.3); backdrop-filter: blur(10px); }
    .no-chat-content { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
    .no-chat-icon { width: 80px; height: 80px; }
    .no-chat-icon svg { width: 100%; height: 100%; }
    .no-chat-content h2 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0; }
    .no-chat-content p { color: #6b7280; margin: 0; max-width: 280px; }
    .start-btn-main { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
    .start-btn-main svg { width: 18px; height: 18px; }
    .start-btn-main:hover { opacity: 0.9; transform: translateY(-1px); }
    @media (max-width: 768px) {
      .sidebar { width: 100%; min-width: 100%; }
      .mobile-hidden { display: none; }
      .main-area { position: fixed; inset: 0; z-index: 10; }
      .mobile-visible { display: flex; }
    }
  `]
})
export class ChatShellComponent implements OnInit, OnDestroy {
  rooms = signal<Room[]>([]);
  loading = signal(true);
  searchQuery = "";
  activeRoomId = signal<number | null>(null);
  showNewChat = signal(false);
  showNotifications = signal(false);
  typingRooms = signal<Set<number>>(new Set());
  presenceMap = signal<Map<number, string>>(new Map());
  showMobileChat = signal(false);
  hasActiveRoom = signal(false);

  private destroy$ = new Subject<void>();
  private typingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private presenceSessionId: string | null = null;
  private presencePingInterval: ReturnType<typeof setInterval> | null = null;

  me = this.auth.currentUser;

  filteredRooms = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.rooms();
    return this.rooms().filter((r) => this.getRoomName(r).toLowerCase().includes(q));
  });

  constructor(
    public auth: AuthService,
    private roomService: RoomService,
    private ws: WebSocketService,
    public notifService: NotificationService,
    private presenceService: PresenceService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.ws.connect();
    this.setupWsListeners();
    this.loadRooms();
    const userId = this.auth.getUserId();
    if (userId) {
      this.notifService.getUnreadCount(userId).subscribe();
      this.connectPresence(userId);
    }
  }

  private connectPresence(userId: number): void {
    const sessionId = `session_${userId}_${Date.now()}`;
    this.presenceSessionId = sessionId;
    this.auth.saveSessionId(sessionId);
    this.presenceService.connect({ userId, status: "ONLINE", deviceType: "WEB", sessionId }).subscribe({
      next: () => {
        this.presencePingInterval = setInterval(() => {
          if (this.presenceSessionId) {
            this.presenceService.ping(this.presenceSessionId).subscribe({ error: () => {} });
          }
        }, 30_000);
      },
      error: () => {},
    });
  }

  private disconnectPresence(): void {
    if (this.presencePingInterval) { clearInterval(this.presencePingInterval); this.presencePingInterval = null; }
    if (this.presenceSessionId) {
      this.presenceService.disconnect(this.presenceSessionId).subscribe({ error: () => {} });
      this.presenceSessionId = null;
    }
  }

  loadRooms(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.loading.set(true);
    this.roomService.getRoomsByUser(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);

        if (this.ws.isConnected()) {
          rooms.forEach((r) => this.ws.subscribeToRoom(r.roomId));
        }

        // Load last message for each room
        rooms.forEach((r) => {
          this.roomService.getLastMessage(r.roomId).subscribe({
            next: (msg) => {
              if (msg) {
                this.rooms.update((list) =>
                  list.map((x) => x.roomId === r.roomId ? { ...x, lastMessage: msg, lastMessageAt: msg.sentAt } : x)
                );
              }
            },
            error: () => {},
          });
        });

        // Load unread count per room
        rooms.forEach((r) => {
          this.roomService.getMembers(r.roomId).subscribe({
            next: (members) => {
              const me = members.find((m: any) => m.userId === userId);
              const after = me?.lastReadAt ?? '2000-01-01T00:00:00';
              this.roomService.getUnreadCountByDate(r.roomId, after).subscribe({
                next: (count) => {
                  this.rooms.update((list) =>
                    list.map((x) => x.roomId === r.roomId ? { ...x, unreadCount: count } : x)
                  );
                },
                error: () => {},
              });
            },
            error: () => {},
          });
        });

        // Load bulk presence for DM rooms
        const dmUserIds = rooms.filter((r) => r.type === "DM" && r.otherUser).map((r) => r.otherUser!.id);
        if (dmUserIds.length) {
          this.presenceService.getBulk(dmUserIds).subscribe((presences) => {
            const map = new Map<number, string>();
            presences.forEach((p) => map.set(p.userId, p.status));
            this.presenceMap.set(map);
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private setupWsListeners(): void {
    this.ws.events.pipe(takeUntil(this.destroy$)).subscribe((evt) => {
      if (evt.kind === "CONNECTED") {
        this.rooms().forEach((r) => this.ws.subscribeToRoom(r.roomId));
      } else if (evt.kind === "MESSAGE") {
        this.handleNewMessage(evt.data as any);
      } else if (evt.kind === "TYPING") {
        const t = evt.data as any;
        if (t.senderId !== this.auth.getUserId()) this.setTyping(t.roomId);
      } else if (evt.kind === "PRESENCE") {
        const p = evt.data as any;
        const map = new Map(this.presenceMap());
        map.set(p.userId, p.status);
        this.presenceMap.set(map);
      }
    });
  }

  private handleNewMessage(msg: any): void {
    const rooms = this.rooms();
    const idx = rooms.findIndex((r) => r.roomId === msg.roomId);
    if (idx >= 0) {
      const updated = [...rooms];
      updated[idx] = { ...updated[idx], lastMessage: msg, lastMessageAt: msg.sentAt };
      if (msg.roomId !== this.activeRoomId()) {
        updated[idx].unreadCount = (updated[idx].unreadCount || 0) + 1;
      }
      updated.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
      this.rooms.set(updated);
    }
  }

  private setTyping(roomId: number): void {
    const set = new Set(this.typingRooms());
    set.add(roomId);
    this.typingRooms.set(set);
    const existing = this.typingTimers.get(roomId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      const s = new Set(this.typingRooms());
      s.delete(roomId);
      this.typingRooms.set(s);
      this.typingTimers.delete(roomId);
    }, 3000);
    this.typingTimers.set(roomId, timer);
  }

  openRoom(room: Room): void {
    this.activeRoomId.set(room.roomId);
    this.hasActiveRoom.set(true);
    this.showMobileChat.set(true);
    const rooms = this.rooms();
    const idx = rooms.findIndex((r) => r.roomId === room.roomId);
    if (idx >= 0 && rooms[idx].unreadCount) {
      const updated = [...rooms];
      updated[idx] = { ...updated[idx], unreadCount: 0 };
      this.rooms.set(updated);
      this.roomService.updateLastRead(room.roomId).subscribe();
    }
    this.router.navigate(["/chat", room.roomId]);
  }

  onRouteActivate(): void { this.hasActiveRoom.set(true); }

  onRoomCreated(room: Room): void {
    this.showNewChat.set(false);
    this.rooms.update((r) => [room, ...r]);
    this.ws.subscribeToRoom(room.roomId);
    this.openRoom(room);
  }

  onSearch(): void {}

  getRoomName(room: Room): string {
    if (room.type === "DM" && room.otherUser) return room.otherUser.fullName || room.otherUser.username;
    return room.name;
  }

  getRoomAvatar(room: Room): string {
    if (room.avatarUrl) return room.avatarUrl;
    if (room.type === "DM" && room.otherUser) return room.otherUser.avatarUrl || this.avatarPlaceholder(room.otherUser);
    return this.groupAvatarPlaceholder(room.name);
  }

  avatarPlaceholder(user: User | null): string {
    if (!user) return "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDAgNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFREU4RkYiLz48cGF0aCBkPSJNMjAgMjJjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMEg5LjVjMC01LjUyMyA0LjQ3Ny0xMCAxMC41LTEwek0yMCAxOGE0IDQgMCAxMTAtOCA0IDQgMCAwMTAgOHoiIGZpbGw9IiM3QzNBRUQiIG9wYWNpdHk9Ii42Ii8+PC9zdmc+";
    const initials = (user.fullName || user.username || "?").charAt(0).toUpperCase();
    const colors = ["#7C3AED", "#A855F7", "#6D28D9", "#8B5CF6"];
    const color = colors[user.id % colors.length];
    const svg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="${color}20"/><text x="20" y="26" text-anchor="middle" fill="${color}" font-family="system-ui" font-size="16" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  groupAvatarPlaceholder(name: string): string {
    const initials = name.substring(0, 2).toUpperCase();
    const svg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#EDE8FF"/><text x="20" y="26" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="13" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  getPresenceStatus(userId: number): string {
    return (this.presenceMap().get(userId) || "OFFLINE").toLowerCase();
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  @HostListener("window:beforeunload")
  onBeforeUnload(): void { this.disconnectPresence(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.disconnect();
    this.disconnectPresence();
    this.typingTimers.forEach((t) => clearTimeout(t));
  }
}