import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Room, RoomMember } from "../../../core/models";
import { RoomService } from "../../../core/services/room.service";
import { AuthService } from "../../../core/services/auth.service";
import { MediaService } from "../../../core/services/media.service";
import { MediaFile } from "../../../core/models";

@Component({
  selector: "app-room-info",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-overlay" (click)="onOverlayClick($event)">
      <div class="info-panel glass" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="panel-header">
          <h3>{{ room.type === "DM" ? "Contact Info" : "Group Info" }}</h3>
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

        <!-- Room Hero -->
        <div class="room-hero">
          <div class="hero-avatar-wrap">
            <img [src]="heroAvatar()" class="hero-avatar" [alt]="heroName()" />
            @if (room.type === "GROUP" && isAdmin()) {
              <label class="avatar-upload-btn" title="Change group photo">
                @if (uploadingAvatar()) {
                  <span class="mini-spinner"></span>
                } @else {
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                    />
                  </svg>
                }
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  (change)="onAvatarFileSelected($event)"
                />
              </label>
            }
          </div>
          <h2>{{ heroName() }}</h2>
          @if (room.description) {
            <p class="hero-desc">{{ room.description }}</p>
          }
          @if (room.type === "GROUP") {
            <span class="member-count-tag">{{ members().length }} members</span>
          }
          @if (room.type === "GROUP" && isAdmin() && room.avatarUrl) {
            <button class="remove-avatar-btn" (click)="removeAvatar()">
              Remove photo
            </button>
          }
        </div>

        <!-- Tabs -->
        <div class="info-tabs">
          <button
            class="itab"
            [class.active]="tab() === 'members'"
            (click)="tab.set('members')"
          >
            Members
          </button>
          <button
            class="itab"
            [class.active]="tab() === 'media'"
            (click)="loadMedia(); tab.set('media')"
          >
            Media
          </button>
        </div>

        <!-- Members Tab -->
        @if (tab() === "members") {
          <div class="tab-body">
            @if (loadingMembers()) {
              <div class="loading-row">
                <span class="mini-spinner"></span> Loading members...
              </div>
            } @else {
              @for (member of sortedMembers(); track member.memberId) {
                <div class="member-row">
                  <div class="member-avatar-wrap">
                    <img
                      [src]="memberAvatar(member)"
                      class="member-avatar"
                      [alt]="memberName(member)"
                    />
                    <span
                      class="status-dot"
                      [class]="'status-' + memberStatus(member).toLowerCase()"
                    ></span>
                  </div>
                  <div class="member-info">
                    <span class="member-name">
                      {{ memberName(member) }}
                      @if (member.userId === myId()) {
                        <span class="you-tag">You</span>
                      }
                    </span>
                    @if (room.type === "GROUP") {
                      <span
                        class="member-role"
                        [class]="'role-' + member.role.toLowerCase()"
                      >
                        {{ member.role === "ADMIN" ? "👑 Admin" : "Member" }}
                      </span>
                    }
                  </div>
                  @if (member.isMuted) {
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="muted-icon"
                      title="Muted"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  }
                </div>
              }
            }
          </div>
        }

        <!-- Media Tab -->
        @if (tab() === "media") {
          <div class="tab-body">
            @if (loadingMedia()) {
              <div class="loading-row">
                <span class="mini-spinner"></span> Loading media...
              </div>
            } @else if (mediaFiles().length === 0) {
              <div class="empty-media">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#F3F0FF" />
                  <rect
                    x="10"
                    y="14"
                    width="28"
                    height="20"
                    rx="3"
                    fill="#7C3AED"
                    opacity=".2"
                  />
                  <path
                    d="M10 28l8-6 5 4 6-8 9 10"
                    stroke="#7C3AED"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="16" cy="21" r="2" fill="#7C3AED" opacity=".5" />
                </svg>
                <p>No media shared yet</p>
              </div>
            } @else {
              <div class="media-grid">
                @for (file of mediaFiles(); track file.mediaId) {
                  @if (mediaService.isImage(file.mimeType)) {
                    <div
                      class="media-thumb"
                      (click)="imageClick.emit(file.url)"
                    >
                      <img
                        [src]="file.thumbnailUrl || file.url"
                        [alt]="file.filename || 'Image'"
                        loading="lazy"
                      />
                    </div>
                  } @else {
                    <a [href]="file.url" target="_blank" class="file-thumb">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fill-rule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <span>{{ file.originalName || "File" }}</span>
                    </a>
                  }
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .panel-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(2px);
        z-index: 300;
        display: flex;
        justify-content: flex-end;
      }
      .glass {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(124, 58, 237, 0.1);
        box-shadow: -8px 0 32px rgba(124, 58, 237, 0.1);
      }
      .info-panel {
        width: 320px;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 16px 14px;
        border-bottom: 1px solid rgba(124, 58, 237, 0.08);
        flex-shrink: 0;
      }
      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .close-btn {
        width: 30px;
        height: 30px;
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
      .room-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px 16px;
        border-bottom: 1px solid rgba(124, 58, 237, 0.06);
        gap: 8px;
        flex-shrink: 0;
      }
      .hero-avatar-wrap {
        position: relative;
        display: inline-block;
      }
      .hero-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(124, 58, 237, 0.2);
      }
      .avatar-upload-btn {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #7c3aed;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 2px solid white;
      }
      .avatar-upload-btn svg {
        width: 13px;
        height: 13px;
      }
      .room-hero h2 {
        font-size: 1.15rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        text-align: center;
      }
      .hero-desc {
        font-size: 0.82rem;
        color: #6b7280;
        text-align: center;
        margin: 0;
      }
      .member-count-tag {
        font-size: 0.78rem;
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;
      }
      .remove-avatar-btn {
        font-size: 0.75rem;
        color: #ef4444;
        background: none;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
      }
      .info-tabs {
        display: flex;
        border-bottom: 2px solid #e5e7eb;
        flex-shrink: 0;
      }
      .itab {
        flex: 1;
        padding: 12px;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition:
          color 0.2s,
          border-color 0.2s;
      }
      .itab.active {
        color: #7c3aed;
        border-bottom-color: #7c3aed;
      }
      .tab-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .tab-body::-webkit-scrollbar {
        width: 4px;
      }
      .tab-body::-webkit-scrollbar-thumb {
        background: rgba(124, 58, 237, 0.2);
        border-radius: 2px;
      }
      .loading-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px;
        color: #9ca3af;
        font-size: 0.85rem;
      }
      .member-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-radius: 12px;
        transition: background 0.15s;
      }
      .member-row:hover {
        background: rgba(124, 58, 237, 0.04);
      }
      .member-avatar-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .member-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid rgba(124, 58, 237, 0.15);
      }
      .status-dot {
        position: absolute;
        bottom: 1px;
        right: 1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid white;
      }
      .status-online {
        background: #10b981;
      }
      .status-away {
        background: #f59e0b;
      }
      .status-dnd {
        background: #ef4444;
      }
      .status-offline,
      .status-invisible {
        background: #9ca3af;
      }
      .member-info {
        flex: 1;
        min-width: 0;
      }
      .member-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
      }
      .you-tag {
        font-size: 0.68rem;
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
        padding: 1px 6px;
        border-radius: 6px;
        font-weight: 700;
      }
      .member-role {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .role-admin {
        color: #d97706;
      }
      .muted-icon {
        width: 16px;
        height: 16px;
        color: #9ca3af;
        flex-shrink: 0;
      }
      .empty-media {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 40px 20px;
      }
      .empty-media svg {
        width: 48px;
        height: 48px;
      }
      .empty-media p {
        color: #9ca3af;
        font-size: 0.875rem;
      }
      .media-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 4px;
      }
      .media-thumb {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
      }
      .media-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.2s;
      }
      .media-thumb:hover img {
        opacity: 0.85;
      }
      .file-thumb {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px;
        background: #f3f0ff;
        border-radius: 8px;
        text-decoration: none;
        aspect-ratio: 1;
        justify-content: center;
      }
      .file-thumb svg {
        width: 24px;
        height: 24px;
        color: #7c3aed;
      }
      .file-thumb span {
        font-size: 0.65rem;
        color: #7c3aed;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        font-weight: 600;
      }
      .mini-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(124, 58, 237, 0.3);
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class RoomInfoComponent implements OnInit {
  @Input({ required: true }) room!: Room;
  @Input() presenceMap: Map<number, string> = new Map();
  @Output() close = new EventEmitter<void>();
  @Output() imageClick = new EventEmitter<string>();
  @Output() roomAvatarUpdated = new EventEmitter<string>();

  tab = signal<"members" | "media">("members");
  members = signal<RoomMember[]>([]);
  mediaFiles = signal<MediaFile[]>([]);
  loadingMembers = signal(true);
  loadingMedia = signal(false);
  mediaLoaded = false;
  uploadingAvatar = signal(false);

  constructor(
    private roomService: RoomService,
    private auth: AuthService,
    public mediaService: MediaService,
  ) {}

  ngOnInit(): void {
    this.roomService.getMembers(this.room.roomId).subscribe({
      next: (m) => {
        this.members.set(m);
        this.loadingMembers.set(false);
      },
      error: () => this.loadingMembers.set(false),
    });
  }

  loadMedia(): void {
    if (this.mediaLoaded) return;
    this.mediaLoaded = true;
    this.loadingMedia.set(true);
    this.mediaService.getByRoom(this.room.roomId).subscribe({
      next: (files) => {
        this.mediaFiles.set(files);
        this.loadingMedia.set(false);
      },
      error: () => this.loadingMedia.set(false),
    });
  }

  myId(): number | null {
    return this.auth.getUserId();
  }

  isAdmin(): boolean {
    return this.members().some(
      (m) => m.userId === this.myId() && m.role === "ADMIN",
    );
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploadingAvatar.set(true);
    this.mediaService.uploadImage(file, this.room.roomId).subscribe({
      next: (media) => {
        console.log("[Avatar] media uploaded:", media);
        this.roomService
          .updateRoom(this.room.roomId, {
            avatarUrl: media.url,
            name: this.room.name,
            type: this.room.type,
          })
          .subscribe({
            next: (updated) => {
              console.log("[Avatar] room updated:", updated);
              this.room = { ...this.room, avatarUrl: updated.avatarUrl };
              this.roomAvatarUpdated.emit(updated.avatarUrl || '');
              this.uploadingAvatar.set(false);
            },
            error: (err) => {
              console.error("[Avatar] updateRoom error:", err);
              this.uploadingAvatar.set(false);
            },
          });
      },
      error: (err) => {
        console.error("[Avatar] upload error:", err);
        this.uploadingAvatar.set(false);
      },
    });
  }

  removeAvatar(): void {
    this.roomService
      .updateRoom(this.room.roomId, {
        avatarUrl: "",
        name: this.room.name,
        type: this.room.type,
      })
      .subscribe({
        next: () => {
          this.room = { ...this.room, avatarUrl: undefined };
          this.roomAvatarUpdated.emit('');
        },
      });
  }

  heroName(): string {
    if (this.room.type === "DM" && this.room.otherUser)
      return this.room.otherUser.fullName || this.room.otherUser.username;
    return this.room.name;
  }

  heroAvatar(): string {
    if (this.room.avatarUrl) return this.room.avatarUrl;
    const initial = this.heroName().charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#EDE8FF"/><text x="40" y="52" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="28" font-weight="800">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  memberAvatar(member: RoomMember): string {
    if (member.user?.avatarUrl) return member.user.avatarUrl;
    const name = this.memberName(member);
    const initial = name.charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#EDE8FF"/><text x="20" y="26" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="14" font-weight="700">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  memberName(member: RoomMember): string {
    return (
      member.user?.fullName || member.user?.username || `User ${member.userId}`
    );
  }

  memberStatus(member: RoomMember): string {
    return this.presenceMap.get(member.userId) ?? "OFFLINE";
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains("panel-overlay"))
      this.close.emit();
  }

  sortedMembers(): RoomMember[] {
    const members = this.members();
    if (this.room.type === "DM") return members;
    return [...members].sort((a, b) => {
      if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
      if (b.role === "ADMIN" && a.role !== "ADMIN") return 1;
      return 0;
    });
  }
}
