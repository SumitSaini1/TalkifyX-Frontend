import { Component, Output, EventEmitter, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { Notification } from "../../core/models";

@Component({
  selector: "app-notifications-panel",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-overlay" (click)="onOverlayClick($event)">
      <div class="panel glass" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <h3>Notifications</h3>
          <div class="header-actions">
            @if (notifications().length > 0) {
              <button class="text-btn" (click)="markAllRead()">
                Mark all read
              </button>
            }
            <button class="close-btn" (click)="close.emit()">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="notif-list">
          @if (loading()) {
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="notif-skeleton">
                <div class="sk-icon"></div>
                <div class="sk-content">
                  <div class="sk-line short"></div>
                  <div class="sk-line long"></div>
                </div>
              </div>
            }
          } @else if (notifications().length === 0) {
            <div class="empty-notifs">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#F3F0FF" />
                <path
                  d="M24 10a10 10 0 00-10 10v6l-2 2v2h24v-2l-2-2v-6a10 10 0 00-10-10z"
                  fill="#7C3AED"
                  opacity=".25"
                />
                <path d="M21 36a3 3 0 006 0" fill="#7C3AED" opacity=".5" />
              </svg>
              <p>All caught up! 🎉</p>
              <span>No new notifications</span>
            </div>
          } @else {
            @for (n of notifications(); track n.notificationId) {
              <div
                class="notif-item"
                [class.unread]="!n.isRead"
                (click)="markRead(n)"
              >
                <div
                  class="notif-icon"
                  [class]="'icon-' + n.type.toLowerCase()"
                >
                  @if (n.type === "NEW_MESSAGE") {
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  } @else if (n.type === "MENTION") {
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a2 2 0 002 2 2 2 0 002-2 6 6 0 00-3.757-5.243zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  } @else if (n.type === "ROOM_INVITE") {
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
                      />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  }
                </div>
                <div class="notif-body">
                  <p class="notif-title">{{ n.title || typeLabel(n.type) }}</p>
                  <p class="notif-msg">{{ n.message }}</p>
                  <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                </div>
                @if (!n.isRead) {
                  <span class="unread-dot"></span>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .panel-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(2px);
        z-index: 400;
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
      }
      .glass {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(124, 58, 237, 0.12);
        box-shadow: -8px 0 32px rgba(124, 58, 237, 0.12);
      }
      .panel {
        width: 360px;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 20px 16px;
        border-bottom: 1px solid rgba(124, 58, 237, 0.08);
        flex-shrink: 0;
      }
      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .text-btn {
        background: none;
        border: none;
        color: #7c3aed;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .text-btn:hover {
        background: rgba(124, 58, 237, 0.08);
      }
      .close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn svg {
        width: 14px;
        height: 14px;
      }

      .notif-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .notif-list::-webkit-scrollbar {
        width: 4px;
      }
      .notif-list::-webkit-scrollbar-thumb {
        background: rgba(124, 58, 237, 0.2);
        border-radius: 2px;
      }

      .notif-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 14px;
        cursor: pointer;
        transition: background 0.15s;
        position: relative;
        margin-bottom: 2px;
      }
      .notif-item:hover {
        background: rgba(124, 58, 237, 0.05);
      }
      .notif-item.unread {
        background: rgba(124, 58, 237, 0.06);
      }

      .notif-icon {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .notif-icon svg {
        width: 18px;
        height: 18px;
      }
      .icon-new_message {
        background: #ede8ff;
        color: #7c3aed;
      }
      .icon-mention {
        background: #fef3c7;
        color: #d97706;
      }
      .icon-room_invite {
        background: #d1fae5;
        color: #059669;
      }
      .icon-system {
        background: #e0f2fe;
        color: #0284c7;
      }

      .notif-body {
        flex: 1;
        min-width: 0;
      }
      .notif-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 3px;
      }
      .notif-msg {
        font-size: 0.8rem;
        color: #6b7280;
        margin: 0 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .notif-time {
        font-size: 0.72rem;
        color: #9ca3af;
      }
      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        flex-shrink: 0;
        margin-top: 4px;
      }

      .empty-notifs {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 60px 20px;
      }
      .empty-notifs svg {
        width: 48px;
        height: 48px;
      }
      .empty-notifs p {
        font-weight: 700;
        color: #374151;
        margin: 0;
        font-size: 1rem;
      }
      .empty-notifs span {
        color: #9ca3af;
        font-size: 0.85rem;
      }

      /* Skeleton */
      .notif-skeleton {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
      }
      .sk-icon {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        background: linear-gradient(
          90deg,
          #f0e6ff 25%,
          #e8d8ff 50%,
          #f0e6ff 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        flex-shrink: 0;
      }
      .sk-content {
        flex: 1;
      }
      .sk-line {
        height: 10px;
        border-radius: 5px;
        background: linear-gradient(
          90deg,
          #f0e6ff 25%,
          #e8d8ff 50%,
          #f0e6ff 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        margin-bottom: 8px;
      }
      .sk-line.short {
        width: 35%;
      }
      .sk-line.long {
        width: 80%;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class NotificationsPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  notifications = signal<Notification[]>([]);
  loading = signal(true);

  constructor(
    private auth: AuthService,
    private notifService: NotificationService,
  ) {}

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.notifService.getNotifications(userId).subscribe({
      next: (page) => {
        this.notifications.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(n: Notification): void {
    if (n.isRead) return;
    this.notifService.markAsRead(n.notificationId).subscribe(() => {
      this.notifications.update((arr) =>
        arr.map((x) =>
          x.notificationId === n.notificationId ? { ...x, isRead: true } : x,
        ),
      );
      this.notifService.unreadCount.update((c) => Math.max(0, c - 1));
    });
  }

  markAllRead(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.notifService.markAllAsRead(userId).subscribe(() => {
      this.notifications.set([]); // ← clear all
      this.notifService.unreadCount.set(0);
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      NEW_MESSAGE: "New message",
      MENTION: "You were mentioned",
      ROOM_INVITE: "Room invitation",
      SYSTEM: "System notification",
    };
    return map[type] || type;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains("panel-overlay"))
      this.close.emit();
  }
}
