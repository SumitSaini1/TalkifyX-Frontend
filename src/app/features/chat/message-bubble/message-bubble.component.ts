import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Message, RoomMember } from "../../../core/models";

@Component({
  selector: "app-message-bubble",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="msg-row"
      [class.own]="isOwn"
      [class.deleted]="message.isDeleted"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Avatar (others only) -->
      @if (!isOwn) {
        <img [src]="senderAvatar()" class="msg-avatar" [alt]="senderName()" />
      }

      <div class="msg-col" [class.own-col]="isOwn">
        <!-- Sender name (group chats) -->
        @if (!isOwn) {
          <span class="sender-name">{{ senderName() }}</span>
        }

        <!-- Bubble row -->
        <div class="bubble-wrap">

          <!-- Three dots button -->
          @if (hovered() && !message.isDeleted) {
            <div class="dots-wrap" [class.own-dots]="isOwn">
              <button class="dots-btn" (click)="toggleMenu($event)">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </button>
              @if (showMenu()) {
                <div class="msg-dropdown" [class.own-dropdown]="isOwn">
                  <button class="dd-item" (click)="onReply()">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Reply
                  </button>
                  @if (isOwn) {
                    <button class="dd-item" (click)="onEdit()">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                      Edit
                    </button>
                  }
                  <button class="dd-item danger" (click)="openDeleteModal()">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Delete
                  </button>
                  <button class="dd-item" (click)="$event.stopPropagation(); showReactPicker.set(!showReactPicker()); showMenu.set(false)">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"/>
                    </svg>
                    React
                  </button>
                </div>
              }
            </div>
          }

          <!-- React picker -->
          @if (showReactPicker()) {
            <div class="react-picker" [class.own-react]="isOwn" (click)="$event.stopPropagation()">
              @for (em of quickEmojis; track em) {
                <button class="react-em" (click)="onReact(em)">{{ em }}</button>
              }
            </div>
          }

          <!-- Bubble body -->
          <div
            class="bubble"
            [class.own-bubble]="isOwn"
            [class.deleted-bubble]="message.isDeleted"
          >
            <!-- ✅ Reply preview INSIDE bubble (WhatsApp-style) -->
            @if (message.replyToMessageId && !message.isDeleted) {
              <div class="reply-quote" [class.own-quote]="isOwn">
                <div class="reply-quote-bar"></div>
                <div class="reply-quote-body">
                  <span class="reply-quote-author">
                    {{ message.replyToMessage?.senderName || 'Original message' }}
                  </span>
                  <span class="reply-quote-text">
                    @if (message.replyToMessage?.isDeleted) {
                      🚫 This message was deleted
                    } @else if (message.replyToMessage?.type === 'IMAGE') {
                      📷 Photo
                    } @else if (message.replyToMessage?.type === 'FILE') {
                      📎 {{ message.replyToMessage?.content || 'File' }}
                    } @else {
                      {{ message.replyToMessage?.content || '...' }}
                    }
                  </span>
                </div>
              </div>
            }

            @if (message.isDeleted) {
              <span class="deleted-text">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;margin-right:4px">
                  <path d="M11 1.5v1h3.5a.5.5 0 010 1h-.538l-.853 10.66A2 2 0 0111.115 16h-6.23a2 2 0 01-1.994-1.84L2.038 3.5H1.5a.5.5 0 010-1H5v-1A1.5 1.5 0 016.5 0h3A1.5 1.5 0 0111 1.5z"/>
                </svg>
                This message was deleted
              </span>
            } @else if (message.type === "IMAGE") {
              <div class="msg-image-wrap">
                <img [src]="message.mediaUrl" class="msg-image" [alt]="message.content || 'Image'" (click)="onImageClick()" loading="lazy"/>
                @if (message.content && message.content !== message.mediaUrl) {
                  <p class="img-caption">{{ message.content }}</p>
                }
              </div>
            } @else if (message.type === "FILE") {
              <a [href]="message.mediaUrl" target="_blank" class="file-attachment">
                <div class="file-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ message.content || "File" }}</span>
                  <span class="file-dl">Download</span>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" class="dl-icon">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </a>
            } @else {
              <p class="msg-text" [innerHTML]="formatText(message.content || '')"></p>
            }

            <div class="msg-meta" [class.own-meta]="isOwn">
              @if (message.isEdited && !message.isDeleted) {
                <span class="edited-tag">edited</span>
              }
              <span class="msg-time">{{ formatTime(message.sentAt) }}</span>
              @if (isOwn && !message.isDeleted) {
                <span class="delivery-icon" [title]="message.deliveryStatus">
                  @if (message.deliveryStatus === "READ") {
                    <svg viewBox="0 0 18 11" fill="none" class="read-check">
                      <path d="M1 5.5L4.5 9 10 3" stroke="#7C3AED" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 5.5L8.5 9 14 3" stroke="#7C3AED" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  } @else if (message.deliveryStatus === "DELIVERED") {
                    <svg viewBox="0 0 18 11" fill="none" class="delivered-check">
                      <path d="M1 5.5L4.5 9 10 3" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 5.5L8.5 9 14 3" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 10 11" fill="none" class="sent-check">
                      <path d="M1 5.5L4.5 9 9 3" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Reactions -->
        @if (message.reactions && message.reactions.length > 0) {
          <div class="reactions-row" [class.own-reactions]="isOwn">
            @for (r of message.reactions; track r.emoji) {
              <button
                class="reaction-chip"
                [class.my-reaction]="myId && r.userIds.includes(myId)"
                [title]="r.count + ' reaction(s)'"
                (click)="onReact(r.emoji)">{{ r.emoji }} {{ r.count }}</button>
            }
          </div>
        }
      </div>
    </div>

    <!-- Delete modal -->
    @if (showDeleteModal()) {
      <div class="delete-overlay" (click)="showDeleteModal.set(false)">
        <div class="delete-modal" (click)="$event.stopPropagation()">
          <p class="delete-title">Delete message?</p>
          <button class="del-btn" (click)="onDeleteForMe()">Delete for me</button>
          @if (isOwn) {
            <button class="del-btn everyone" (click)="onDeleteForEveryone()">Delete for everyone</button>
          }
          <button class="del-btn cancel" (click)="showDeleteModal.set(false)">Cancel</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 6px;
      max-width: 100%;
      animation: msgIn 0.2s ease;
    }
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .msg-row.own { flex-direction: row-reverse; }
    .msg-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      object-fit: cover; flex-shrink: 0;
      border: 1.5px solid rgba(124,58,237,0.15);
      align-self: flex-end;
    }
    .msg-col {
      display: flex; flex-direction: column;
      max-width: 68%; gap: 2px;
    }
    .own-col { align-items: flex-end; }
    .sender-name {
      font-size: 0.72rem; font-weight: 700;
      color: #7c3aed; padding: 0 12px; margin-bottom: 2px;
    }
    /* ===== Reply quote INSIDE bubble (WhatsApp-style) ===== */
    .reply-quote {
      display: flex; align-items: stretch; gap: 0;
      background: rgba(0,0,0,0.06);
      border-radius: 8px; margin-bottom: 6px;
      overflow: hidden; cursor: default;
    }
    .own-quote { background: rgba(0,0,0,0.12); }
    .reply-quote-bar {
      width: 3px; background: rgba(255,255,255,0.8); flex-shrink: 0;
    }
    .reply-quote:not(.own-quote) .reply-quote-bar { background: #7c3aed; }
    .reply-quote-body {
      display: flex; flex-direction: column; gap: 1px;
      padding: 5px 8px; min-width: 0; overflow: hidden;
    }
    .reply-quote-author {
      font-size: 0.72rem; font-weight: 700;
      color: rgba(255,255,255,0.95);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .reply-quote:not(.own-quote) .reply-quote-author { color: #7c3aed; }
    .reply-quote-text {
      font-size: 0.78rem; color: rgba(255,255,255,0.78);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .reply-quote:not(.own-quote) .reply-quote-text { color: #4b5563; }
    .bubble-wrap {
      position: relative; display: flex;
      align-items: center; gap: 6px;
    }
    .msg-row.own .bubble-wrap { flex-direction: row-reverse; }

    /* Dots */
    .dots-wrap { position: relative; }
    .dots-btn {
      width: 26px; height: 26px; border-radius: 50%;
      border: none; background: rgba(255,255,255,0.9);
      box-shadow: 0 1px 6px rgba(0,0,0,0.12);
      color: #6b7280; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .dots-btn:hover { background: #f3f0ff; color: #7c3aed; }
    .dots-btn svg { width: 14px; height: 14px; }

    /* Dropdown */
    .msg-dropdown {
      position: absolute;
      top: 32px; left: 0;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(124,58,237,0.12);
      border-radius: 12px;
      padding: 4px;
      min-width: 140px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 200;
    }
    .own-dropdown { left: auto; right: 0; }
    .dd-item {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 12px;
      border: none; background: transparent;
      font-size: 0.85rem; color: #374151;
      cursor: pointer; border-radius: 8px;
      transition: background 0.15s;
      text-align: left;
    }
    .dd-item:hover { background: #f3f0ff; color: #7c3aed; }
    .dd-item.danger:hover { background: #fef2f2; color: #ef4444; }
    .dd-item svg { width: 14px; height: 14px; flex-shrink: 0; }

    /* React picker */
    .react-picker {
      position: absolute;
      bottom: calc(100% + 8px); left: 0;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(124,58,237,0.12);
      border-radius: 12px; padding: 6px;
      display: flex; gap: 2px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 200;
    }
    .own-react { left: auto; right: 0; }
    .react-em {
      border: none; background: none; cursor: pointer;
      font-size: 1.2rem; padding: 3px; border-radius: 6px;
      transition: background 0.15s; line-height: 1;
    }
    .react-em:hover { background: #f3f0ff; }

    /* Bubble */
    .bubble {
      padding: 10px 14px;
      border-radius: 18px 18px 18px 4px;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(124,58,237,0.08);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      max-width: 100%; word-break: break-word;
    }
    .own-bubble {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border-radius: 18px 18px 4px 18px;
      border: none; color: white;
    }
    .deleted-bubble { opacity: 0.55; font-style: italic; }
    .msg-text {
      margin: 0; font-size: 0.92rem;
      line-height: 1.55; white-space: pre-wrap; color: inherit;
    }
    .deleted-text {
      display: flex; align-items: center;
      color: #9ca3af; font-size: 0.85rem;
    }
    .msg-image-wrap { max-width: 260px; }
    .msg-image {
      width: 100%; max-width: 260px; max-height: 220px;
      object-fit: cover; border-radius: 12px;
      cursor: pointer; display: block; transition: opacity 0.2s;
    }
    .msg-image:hover { opacity: 0.9; }
    .img-caption { margin: 6px 0 0; font-size: 0.85rem; color: inherit; }
    .file-attachment {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; padding: 8px 4px;
      color: inherit; min-width: 200px;
    }
    .file-icon {
      width: 36px; height: 36px;
      background: rgba(124,58,237,0.12);
      border-radius: 8px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .file-icon svg { width: 20px; height: 20px; color: #7c3aed; }
    .own-bubble .file-icon { background: rgba(255,255,255,0.2); }
    .own-bubble .file-icon svg { color: white; }
    .file-info { flex: 1; min-width: 0; }
    .file-name {
      display: block; font-size: 0.85rem; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .file-dl { display: block; font-size: 0.72rem; opacity: 0.7; }
    .dl-icon { width: 16px; height: 16px; opacity: 0.7; flex-shrink: 0; }
    .msg-meta {
      display: flex; align-items: center;
      justify-content: flex-end; gap: 4px; margin-top: 4px;
    }
    .edited-tag { font-size: 0.65rem; opacity: 0.6; }
    .msg-time { font-size: 0.68rem; opacity: 0.65; white-space: nowrap; }
    .delivery-icon { display: flex; align-items: center; }
    .read-check, .delivered-check { width: 18px; height: 11px; }
    .sent-check { width: 10px; height: 11px; }
    .reactions-row {
      display: flex; flex-wrap: wrap;
      gap: 4px; margin-top: 4px; padding: 0 2px;
    }
    .own-reactions { justify-content: flex-end; }
    .reaction-chip {
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(124,58,237,0.15);
      border-radius: 20px; padding: 2px 8px;
      font-size: 0.8rem; cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: all 0.15s;
    }
    .reaction-chip:hover {
      background: rgba(124,58,237,0.08);
      border-color: rgba(124,58,237,0.35);
      transform: scale(1.08);
    }
    .reaction-chip.my-reaction {
      background: rgba(124,58,237,0.12);
      border-color: rgba(124,58,237,0.5);
      font-weight: 700;
    }
    .msg-row.deleted { opacity: 0.6; }

    /* Delete modal */
    .delete-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .delete-modal {
      background: white; border-radius: 16px;
      padding: 24px 20px; min-width: 260px;
      display: flex; flex-direction: column; gap: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .delete-title {
      font-size: 1rem; font-weight: 700;
      color: #1f2937; margin: 0 0 4px; text-align: center;
    }
    .del-btn {
      padding: 10px; border-radius: 10px; border: none;
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s;
    }
    .del-btn { background: #f3f4f6; color: #374151; }
    .del-btn:hover { opacity: 0.8; }
    .del-btn.everyone { background: #fef2f2; color: #ef4444; }
    .del-btn.cancel { background: transparent; color: #9ca3af; }
  `],
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() isOwn = false;
  @Input() members: RoomMember[] = [];
  @Input() replyTarget: Message | null = null;
  @Input() myId: number | null = null;

  @Output() replyTo = new EventEmitter<Message>();
  @Output() edit = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<Message>();
  @Output() deleteForMe = new EventEmitter<Message>();
  @Output() react = new EventEmitter<{ messageId: string; emoji: string }>();
  @Output() imageClick = new EventEmitter<string>();

  hovered = signal(false);
  showMenu = signal(false);
  showReactPicker = signal(false);
  showDeleteModal = signal(false);

  quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

  @HostListener("document:click")
  onDocClick() {
    this.showMenu.set(false);
    this.showReactPicker.set(false);
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.showMenu.update(v => !v);
    this.showReactPicker.set(false);
  }

  onMouseLeave(): void {
    this.hovered.set(false);
    
  }

  openDeleteModal(): void {
    this.showMenu.set(false);
    this.showDeleteModal.set(true);
  }

  onDeleteForMe(): void {
    this.showDeleteModal.set(false);
    this.deleteForMe.emit(this.message);
  }

  onDeleteForEveryone(): void {
    this.showDeleteModal.set(false);
    this.delete.emit(this.message);
  }

  senderName(): string {
    return this.message.senderName || `User ${this.message.senderId}`;
  }

  senderAvatar(): string {
    if (this.message.senderAvatar) return this.message.senderAvatar;
    const name = this.senderName().charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#EDE8FF"/><text x="16" y="21" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="13" font-weight="700">${name}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  formatText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:inherit;text-decoration:underline;opacity:0.85">$1</a>');
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  onReply(): void {
    this.showMenu.set(false);
    this.replyTo.emit(this.message);
  }

  onEdit(): void {
    this.showMenu.set(false);
    this.edit.emit(this.message);
  }

  onReact(emoji: string): void {
    this.react.emit({ messageId: this.message.messageId, emoji });
    this.showReactPicker.set(false);
  }

  onImageClick(): void {
    if (this.message.mediaUrl) this.imageClick.emit(this.message.mediaUrl);
  }
}