import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { MessageService } from "../../../core/services/message.service";
import { RoomService } from "../../../core/services/room.service";
import {
  WebSocketService,
  WsEvent,
} from "../../../core/services/websocket.service";
import { MediaService } from "../../../core/services/media.service";
import { PresenceService } from "../../../core/services/presence.service";
import {
  Message,
  Room,
  RoomMember,
  MessageRequest,
  ChatPayload,
  TypingPayload,
  ReadReceiptPayload,
} from "../../../core/models";
import { MessageBubbleComponent } from "../message-bubble/message-bubble.component";
import { RoomInfoComponent } from "../room-info/room-info.component";

@Component({
  selector: "app-chat-window",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageBubbleComponent,
    RoomInfoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-window">
      <!-- Header -->
      <div class="chat-header glass-header">
        <button class="back-btn" (click)="goBack()">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div class="header-avatar-wrap">
          <img
            [src]="roomAvatarUrl()"
            (error)="$any($event.target).src = roomAvatarUrl()"
            class="header-avatar"
            [alt]="roomName()"
          />
          <span
            class="status-dot"
            [class]="'status-' + otherUserStatus()"
          ></span>
        </div>
        <div class="header-info">
          <h3 class="header-name">{{ roomName() }}</h3>
          <span class="header-sub">
            @if (typingUsers().size > 0) {
              <span class="typing-indicator">
                <span class="typing-dots"
                  ><span></span><span></span><span></span
                ></span>
                @if (room()?.type === "GROUP") {
                  {{
                    typingNames().length === 1
                      ? typingNames()[0] + " is typing..."
                      : typingNames().slice(0, -1).join(", ") +
                        " & " +
                        typingNames().at(-1) +
                        " are typing..."
                  }}
                } @else {
                  typing...
                }
              </span>
            } @else {
              {{ headerSubtitle() }}
            }
          </span>
        </div>
        <div class="header-actions">
          <button
            class="icon-btn"
            (click)="toggleSearch()"
            title="Search messages"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <button
            class="icon-btn"
            (click)="showInfo.set(!showInfo())"
            title="Room info"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Search bar -->
      @if (searchOpen()) {
        <div class="search-bar">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
          <input
            #searchInput
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search messages..."
            autofocus
          />
          <button (click)="closeSearch()">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      }

      <!-- Media preview upload strip -->
      @if (pendingFiles().length > 0) {
        <div class="media-preview-strip">
          @for (pf of pendingFiles(); track pf.id) {
            <div class="preview-item">
              @if (pf.isImage) {
                <img
                  [src]="pf.previewUrl"
                  class="preview-img"
                  [alt]="pf.file.name"
                />
              } @else {
                <div class="preview-file">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>{{ pf.file.name }}</span>
                </div>
              }
              <button class="remove-preview" (click)="removeFile(pf.id)">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <!-- Messages area -->
      <div class="messages-area" #messagesContainer (scroll)="onScroll()">
        <!-- Load more -->
        @if (hasMoreMessages() && !loadingMore()) {
          <div class="load-more-wrap">
            <button class="load-more-btn" (click)="loadMore()">
              Load earlier messages
            </button>
          </div>
        }
        @if (loadingMore()) {
          <div class="load-more-wrap">
            <span class="mini-spinner"></span>
          </div>
        }

        <!-- Initial load -->
        @if (loading()) {
          <div class="messages-loading">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="msg-skeleton" [class.right]="i % 3 === 0">
                <div
                  class="sk-bubble"
                  [style.width.px]="80 + ((i * 30) % 120)"
                ></div>
              </div>
            }
          </div>
        } @else if (messages().length === 0 && !loading()) {
          <div class="empty-messages">
            <div class="empty-icon">
              <svg viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="30" fill="#F3F0FF" />
                <path
                  d="M14 22c0-2 1.6-3.5 3.5-3.5H42.5C44.4 18.5 46 20 46 22V34c0 2-1.6 3.5-3.5 3.5H36l-6 4.5V37.5H17.5C15.6 37.5 14 36 14 34V22z"
                  fill="#7C3AED"
                  opacity=".3"
                />
              </svg>
            </div>
            <p>No messages yet.<br />Say hello! 👋</p>
          </div>
        } @else {
          @for (group of messageGroups(); track group.date) {
            <div class="date-group">
              <div class="date-divider">
                <span>{{ group.date }}</span>
              </div>
              @for (msg of group.messages; track msg.messageId) {
                <app-message-bubble
                  [message]="msg"
                  [isOwn]="msg.senderId === myId()"
                  [members]="members()"
                  [replyTarget]="replyTarget()"
                  [myId]="myId()"
                  (replyTo)="setReply($event)"
                  (edit)="startEdit($event)"
                  (delete)="deleteMsg($event)"
                  (deleteForMe)="deleteMsgForMe($event)"
                  (react)="sendReaction($event.messageId, $event.emoji)"
                  (imageClick)="openLightbox($event)"
                />
              }
            </div>
          }
        }
        <div #messagesEnd></div>
      </div>

      <!-- Reply preview -->
      @if (replyTarget()) {
        <div class="reply-preview">
          <div class="reply-bar"></div>
          <div class="reply-content">
            <span class="reply-to">Replying to {{ getReplyAuthor() }}</span>
            <span class="reply-text">{{
              replyTarget()?.content || "📎 Media"
            }}</span>
          </div>
          <button class="cancel-reply" (click)="replyTarget.set(null)">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      }

      <!-- Edit preview -->
      @if (editTarget()) {
        <div class="reply-preview edit-preview">
          <div class="reply-bar edit-bar"></div>
          <div class="reply-content">
            <span class="reply-to">Editing message</span>
            <span class="reply-text">{{ editTarget()?.content }}</span>
          </div>
          <button class="cancel-reply" (click)="cancelEdit()">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      }

      <!-- Input bar -->
      <div class="input-bar glass-input">
        <button
          class="attach-btn"
          (click)="fileInput.click()"
          title="Attach file"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <input
          #fileInput
          type="file"
          multiple
          accept="image/*,.pdf,.docx,.zip,.xlsx"
          hidden
          (change)="onFilesSelected($event)"
        />

        <div class="text-input-wrap">
          <textarea
            #messageInput
            [(ngModel)]="messageText"
            (input)="onInput()"
            (keydown)="onKeydown($event)"
            placeholder="Type a message..."
            rows="1"
            [disabled]="sending()"
          ></textarea>
        </div>

        <button
          class="emoji-btn"
          (click)="showEmojiPicker.set(!showEmojiPicker())"
          title="Emoji"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <button
          class="send-btn"
          (click)="send()"
          [disabled]="!canSend() || sending()"
        >
          @if (sending()) {
            <span class="send-spinner"></span>
          } @else {
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
              />
            </svg>
          }
        </button>

        <!-- Emoji picker -->
        @if (showEmojiPicker()) {
          <div class="emoji-picker glass">
            @for (em of quickEmojis; track em) {
              <button class="emoji-item" (click)="insertEmoji(em)">
                {{ em }}
              </button>
            }
          </div>
        }
      </div>
    </div>

    <!-- Lightbox -->
    @if (lightboxUrl()) {
      <div class="lightbox" (click)="lightboxUrl.set('')">
        <img
          [src]="lightboxUrl()"
          (click)="$event.stopPropagation()"
          alt="Image preview"
        />
        <button class="lightbox-close" (click)="lightboxUrl.set('')">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    }

    <!-- Room Info Panel -->
    <!-- Room Info Panel -->
    @if (showInfo() && room()) {
      <app-room-info
        [room]="room()!"
        [presenceMap]="presenceMapRef()"
        (close)="showInfo.set(false)"
        (imageClick)="openLightbox($event)"
        (roomAvatarUpdated)="onRoomAvatarUpdated($event)"
      />
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100vh;
        overflow: hidden;
      }
      .chat-window {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(160deg, #faf7ff 0%, #f3eeff 100%);
      }
      .glass-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(124, 58, 237, 0.1);
        box-shadow: 0 2px 12px rgba(124, 58, 237, 0.06);
        flex-shrink: 0;
        z-index: 10;
      }
      .back-btn {
        display: none;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: none;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
        cursor: pointer;
      }
      .back-btn svg {
        width: 18px;
        height: 18px;
      }
      @media (max-width: 768px) {
        .back-btn {
          display: flex;
        }
      }
      .header-avatar-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .header-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(124, 58, 237, 0.2);
      }
      .status-dot {
        position: absolute;
        bottom: 1px;
        right: 1px;
        width: 11px;
        height: 11px;
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
      .header-info {
        flex: 1;
        min-width: 0;
      }
      .header-name {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .header-sub {
        font-size: 0.78rem;
        color: #9ca3af;
      }
      .typing-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #7c3aed;
      }
      .typing-dots {
        display: flex;
        gap: 3px;
      }
      .typing-dots span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #7c3aed;
        animation: typingBounce 1.2s infinite;
      }
      .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes typingBounce {
        0%,
        60%,
        100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-4px);
        }
      }
      .header-actions {
        display: flex;
        gap: 6px;
      }
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: none;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
      }
      .icon-btn:hover {
        background: rgba(124, 58, 237, 0.15);
      }
      .icon-btn svg {
        width: 18px;
        height: 18px;
      }
      .search-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(124, 58, 237, 0.08);
        flex-shrink: 0;
      }
      .search-bar svg {
        width: 16px;
        height: 16px;
        color: #9ca3af;
        flex-shrink: 0;
      }
      .search-bar input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.9rem;
        color: #374151;
        outline: none;
      }
      .search-bar button {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        display: flex;
        align-items: center;
      }
      .search-bar button svg {
        width: 16px;
        height: 16px;
      }
      .media-preview-strip {
        display: flex;
        gap: 10px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.7);
        border-bottom: 1px solid rgba(124, 58, 237, 0.08);
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .preview-item {
        position: relative;
        border-radius: 10px;
        overflow: visible;
      }
      .preview-img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 10px;
        border: 2px solid rgba(124, 58, 237, 0.2);
      }
      .preview-file {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        width: 72px;
        height: 72px;
        background: #f3f0ff;
        border-radius: 10px;
        padding: 8px;
        justify-content: center;
        border: 2px solid rgba(124, 58, 237, 0.2);
      }
      .preview-file svg {
        width: 24px;
        height: 24px;
        color: #7c3aed;
      }
      .preview-file span {
        font-size: 0.65rem;
        color: #7c3aed;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 60px;
      }
      .remove-preview {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ef4444;
        border: none;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .remove-preview svg {
        width: 10px;
        height: 10px;
      }
      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        scroll-behavior: smooth;
      }
      .messages-area::-webkit-scrollbar {
        width: 5px;
      }
      .messages-area::-webkit-scrollbar-track {
        background: transparent;
      }
      .messages-area::-webkit-scrollbar-thumb {
        background: rgba(124, 58, 237, 0.2);
        border-radius: 3px;
      }
      .load-more-wrap {
        display: flex;
        justify-content: center;
        padding: 8px 0;
      }
      .load-more-btn {
        padding: 6px 16px;
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
        border: none;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .load-more-btn:hover {
        background: rgba(124, 58, 237, 0.2);
      }
      .mini-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(124, 58, 237, 0.3);
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
      }
      .messages-loading {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px 0;
      }
      .msg-skeleton {
        display: flex;
        justify-content: flex-start;
      }
      .msg-skeleton.right {
        justify-content: flex-end;
      }
      .sk-bubble {
        height: 40px;
        border-radius: 16px;
        background: linear-gradient(
          90deg,
          #f0e6ff 25%,
          #e8d8ff 50%,
          #f0e6ff 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .empty-icon svg {
        width: 60px;
        height: 60px;
      }
      .empty-messages p {
        text-align: center;
        color: #9ca3af;
        font-size: 0.9rem;
        line-height: 1.6;
      }
      .date-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 4px;
      }
      .date-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 12px 0 8px;
      }
      .date-divider::before,
      .date-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: rgba(124, 58, 237, 0.12);
      }
      .date-divider span {
        font-size: 0.72rem;
        color: #9ca3af;
        font-weight: 600;
        white-space: nowrap;
        background: rgba(243, 240, 255, 0.8);
        padding: 3px 10px;
        border-radius: 10px;
      }
      .reply-preview {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.85);
        border-top: 1px solid rgba(124, 58, 237, 0.08);
        flex-shrink: 0;
      }
      .reply-bar {
        width: 3px;
        height: 36px;
        background: #7c3aed;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .edit-bar {
        background: #f59e0b;
      }
      .reply-content {
        flex: 1;
        min-width: 0;
      }
      .reply-to {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        color: #7c3aed;
        margin-bottom: 2px;
      }
      .reply-text {
        display: block;
        font-size: 0.82rem;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cancel-reply {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        display: flex;
        align-items: center;
      }
      .cancel-reply svg {
        width: 16px;
        height: 16px;
      }
      .glass-input {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid rgba(124, 58, 237, 0.1);
        position: relative;
        flex-shrink: 0;
      }
      .attach-btn,
      .emoji-btn {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: none;
        background: rgba(124, 58, 237, 0.08);
        color: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .attach-btn:hover,
      .emoji-btn:hover {
        background: rgba(124, 58, 237, 0.15);
      }
      .attach-btn svg,
      .emoji-btn svg {
        width: 18px;
        height: 18px;
      }
      .text-input-wrap {
        flex: 1;
        background: rgba(124, 58, 237, 0.05);
        border: 1.5px solid rgba(124, 58, 237, 0.15);
        border-radius: 14px;
        padding: 4px 12px;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .text-input-wrap:focus-within {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        background: white;
      }
      textarea {
        width: 100%;
        border: none;
        background: transparent;
        outline: none;
        font-size: 0.95rem;
        color: #1f2937;
        resize: none;
        min-height: 36px;
        max-height: 120px;
        padding: 8px 0;
        line-height: 1.5;
        font-family: inherit;
      }
      textarea::placeholder {
        color: #9ca3af;
      }
      .send-btn {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition:
          opacity 0.2s,
          transform 0.1s;
        flex-shrink: 0;
      }
      .send-btn:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .send-btn svg {
        width: 20px;
        height: 20px;
      }
      .send-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      .emoji-picker {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 60px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(124, 58, 237, 0.15);
        border-radius: 16px;
        padding: 10px;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
        box-shadow: 0 8px 32px rgba(124, 58, 237, 0.15);
        z-index: 100;
      }
      .emoji-item {
        border: none;
        background: none;
        cursor: pointer;
        font-size: 1.3rem;
        padding: 4px;
        border-radius: 8px;
        transition: background 0.15s;
        line-height: 1;
      }
      .emoji-item:hover {
        background: rgba(124, 58, 237, 0.1);
      }
      .lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox img {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 12px;
      }
      .lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox-close svg {
        width: 20px;
        height: 20px;
      }
    `,
  ],
})
export class ChatWindowComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild("messagesContainer")
  messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild("messagesEnd") messagesEnd!: ElementRef<HTMLDivElement>;
  @ViewChild("messageInput") messageInput!: ElementRef<HTMLTextAreaElement>;

  room = signal<Room | null>(null);
  messages = signal<Message[]>([]);
  members = signal<RoomMember[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  sending = signal(false);
  hasMoreMessages = signal(false);
  currentPage = signal(0);

  messageText = "";
  replyTarget = signal<Message | null>(null);
  editTarget = signal<Message | null>(null);
  typingUsers = signal<Set<number>>(new Set());
  typingNames = signal<string[]>([]);
  showEmojiPicker = signal(false);
  searchOpen = signal(false);
  searchQuery = "";
  showInfo = signal(false);
  lightboxUrl = signal("");

  // FIXED: was missing opening < for generic type
  pendingFiles = signal<
    { id: string; file: File; isImage: boolean; previewUrl: string }[]
  >([]);

  myId = signal<number | null>(null);
  presenceStatus = signal<string>("OFFLINE");
  presenceMapRef = signal<Map<number, string>>(new Map());

  private destroy$ = new Subject<void>();
  private wsSubscribed = false;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private typingUserTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private shouldScrollBottom = true;
  private isAtBottom = true;

  quickEmojis = [
    "😀",
    "😂",
    "❤️",
    "👍",
    "👎",
    "🔥",
    "🎉",
    "😍",
    "🤔",
    "😮",
    "😢",
    "😡",
    "🙏",
    "💯",
    "✅",
    "🚀",
    "👏",
    "💪",
    "😎",
    "🤣",
    "💀",
    "🥰",
    "👀",
    "🫡",
  ];

  messageGroups = signal<{ date: string; messages: Message[] }[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private messageService: MessageService,
    private roomService: RoomService,
    private ws: WebSocketService,
    private mediaService: MediaService,
    private presenceService: PresenceService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.myId.set(this.auth.getUserId());
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const roomId = Number(params["roomId"]);
      if (roomId) {
        this.loadRoom(roomId);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
    }
  }

  private loadRoom(roomId: number): void {
    this.loading.set(true);
    this.messages.set([]);
    this.messageGroups.set([]);
    this.currentPage.set(0);
    this.shouldScrollBottom = true;

    const prevRoom = this.room();
    if (prevRoom && prevRoom.roomId !== roomId) {
      this.ws.unsubscribeFromRoom(prevRoom.roomId);
    }

    this.roomService.getRoomById(roomId).subscribe({
      next: (r) => {
        this.room.set(r);

        if (!this.wsSubscribed) {
          this.wsSubscribed = true;
          this.ws.events
            .pipe(takeUntil(this.destroy$))
            .subscribe((evt) => this.handleWsEvent(evt));
        }

        this.ws.subscribeToRoom(roomId);
        this.loadMessages(roomId, 0);
        this.roomService.getMembers(roomId).subscribe((members) => {
          this.members.set(members);
          const memberUserIds = members.map((m) => m.userId);
          if (memberUserIds.length) {
            this.presenceService.getBulk(memberUserIds).subscribe({
              next: (presences) => {
                const map = new Map<number, string>();
                presences.forEach((p) => map.set(p.userId, p.status));
                this.presenceMapRef.set(map);
                if (r.type === "DM" && r.otherUser) {
                  this.presenceStatus.set(map.get(r.otherUser.id) ?? "OFFLINE");
                }
                this.cdr.markForCheck();
              },
              error: () => {},
            });
          }
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private loadMessages(roomId: number, page: number): void {
    this.messageService.getMessagesByRoom(roomId, page, 20).subscribe({
      next: (paged) => {
        const msgs = [...paged.content].reverse();
        if (page === 0) {
          this.messages.set(msgs);
          this.shouldScrollBottom = true;
          // Persist lastReadAt and mark all messages as READ in DB
          this.roomService.updateLastRead(roomId).subscribe({ error: () => {} });
          // Also send WS read receipt for the latest message
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.senderId !== this.myId()) {
            this.ws.sendReadReceipt({
              type: "READ_RECEIPT",
              roomId,
              messageId: lastMsg.messageId,
            });
          }
        } else {
          this.messages.update((existing) => [...msgs, ...existing]);
          this.shouldScrollBottom = false;
        }
        this.hasMoreMessages.set(!paged.first && paged.totalPages > page + 1);
        this.currentPage.set(page);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.rebuildGroups();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }


  loadMore(): void {
    if (!this.room() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.loadMessages(this.room()!.roomId, this.currentPage() + 1);
  }

  private handleWsEvent(evt: WsEvent): void {
    const roomId = this.room()?.roomId;
    if (!roomId) return;

    if (evt.kind === "MESSAGE") {
      const msg = evt.data as Message;
      if (Number(msg.roomId) === Number(roomId)) {
        const existing = this.messages().find(
          (m) => m.messageId === msg.messageId,
        );
        if (existing) {
          if (msg.senderId === this.myId()) {
            this.zone.run(() => {
              this.messages.update((msgs) =>
                msgs.map((m) =>
                  m.messageId === msg.messageId
                    ? { ...m, deliveryStatus: "DELIVERED" as any }
                    : m,
                ),
              );
              this.rebuildGroups();
              this.cdr.markForCheck();
            });
          }
        } else {
          this.zone.run(() => {
            this.messages.update((m) => [...m, msg]);
            this.rebuildGroups();
            this.shouldScrollBottom = this.isAtBottom;
            this.cdr.markForCheck();
            if (msg.senderId !== this.myId()) {
              this.ws.sendReadReceipt({
                type: "READ_RECEIPT",
                roomId,
                messageId: msg.messageId,
              });
            }
          });
        }
      }
    } else if (evt.kind === "TYPING") {
      const t = evt.data as TypingPayload;
      if (t.roomId === roomId && t.senderId !== this.myId()) {
        this.zone.run(() => {
          const set = new Set(this.typingUsers());
          set.add(t.senderId);
          this.typingUsers.set(set);

          const member = this.members().find((m) => m.userId === t.senderId);
          const name =
            member?.user?.fullName ||
            member?.user?.username ||
            `User ${t.senderId}`;
          this.typingNames.update((names) =>
            names.includes(name) ? names : [...names, name],
          );

          const existing = this.typingUserTimers.get(t.senderId);
          if (existing) clearTimeout(existing);
          const timer = setTimeout(() => {
            const s = new Set(this.typingUsers());
            s.delete(t.senderId);
            this.typingUsers.set(s);
            this.typingNames.update((names) => names.filter((n) => n !== name));
            this.cdr.markForCheck();
          }, 3000);
          this.typingUserTimers.set(t.senderId, timer);
          this.cdr.markForCheck();
        });
      }
    } else if (evt.kind === "READ") {
      const r = evt.data as ReadReceiptPayload;
      if (r.roomId === roomId) {
        this.zone.run(() => {
          let reached = false;
          this.messages.update((msgs) =>
            [...msgs]
              .reverse()
              .map((m) => {
                if (m.messageId === r.upToMessageId) reached = true;
                if (reached && m.senderId === this.myId()) {
                  return { ...m, deliveryStatus: "READ" as any };
                }
                return m;
              })
              .reverse(),
          );
          this.rebuildGroups();
          this.cdr.markForCheck();
        });
      }
    } else if (evt.kind === "MSG_EDIT") {
      const p = evt.data as any;
      if (p.roomId === roomId) {
        this.zone.run(() => {
          this.messages.update((msgs) =>
            msgs.map((m) =>
              m.messageId === p.messageId
                ? { ...m, content: p.newContent, isEdited: true }
                : m,
            ),
          );
          this.rebuildGroups();
          this.cdr.markForCheck();
        });
      }
    } else if (evt.kind === "MSG_DELETE") {
      const p = evt.data as any;
      if (p.roomId === roomId) {
        this.zone.run(() => {
          if (p.deleteType === 'ME') {
            this.messages.update((msgs) =>
              msgs.filter((m) => m.messageId !== p.deletedId)
            );
          } else {
            this.messages.update((msgs) =>
              msgs.map((m) =>
                m.messageId === p.deletedId
                  ? { ...m, isDeleted: true, content: "This message was deleted" }
                  : m,
              ),
            );
          }
          this.rebuildGroups();
          this.cdr.markForCheck();
        });
      }
    } else if (evt.kind === "REACTION") {
      const p = evt.data as any;
      if (p.roomId === roomId || p.messageId) {
        this.zone.run(() => {
          this.messages.update((msgs) =>
            msgs.map((m) =>
              m.messageId === p.messageId
                ? { ...m, reactions: p.reactions ?? [] }
                : m
            )
          );
          this.rebuildGroups();
          this.cdr.markForCheck();
        });
      }
    } else if (evt.kind === "PRESENCE") {
      const p = evt.data as any;
      this.zone.run(() => {
        const map = new Map(this.presenceMapRef());
        map.set(p.userId, p.status);
        this.presenceMapRef.set(map);
        const r = this.room();
        if (r?.type === "DM" && r.otherUser?.id === p.userId) {
          this.presenceStatus.set(p.status);
        }
        this.cdr.markForCheck();
      });
    }
  }

  private rebuildGroups(): void {
    const msgs = this.messages();
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    msgs.forEach((m) => {
      const d = this.formatGroupDate(m.sentAt);
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [] });
      }
      groups[groups.length - 1].messages.push(m);
    });
    this.messageGroups.set(groups);
  }

  private formatGroupDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (msgDate.getTime() === today.getTime()) return "Today";
    if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  onInput(): void {
    const ta = this.messageInput?.nativeElement;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
    this.sendTypingIndicator();
    if (this.showEmojiPicker()) this.showEmojiPicker.set(false);
  }

  private sendTypingIndicator(): void {
    const roomId = this.room()?.roomId;
    if (!roomId) return;
    this.ws.sendTyping({ type: "TYPING_INDICATOR", roomId });
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  async send(): Promise<void> {
    const roomId = this.room()?.roomId;
    if (!roomId || this.sending()) return;

    if (this.pendingFiles().length > 0) {
      await this.sendFiles(roomId);
      return;
    }

    const content = this.messageText.trim();
    if (!content && !this.editTarget()) return;
    if (this.editTarget()) {
      this.submitEdit(content);
      return;
    }

    // Only send via WS — ChatStompController saves and broadcasts
    this.ws.sendMessage({
      type: "CHAT_MESSAGE",
      roomId,
      content,
      replyToId: this.replyTarget()?.messageId,
    });
    this.messageText = "";
    this.replyTarget.set(null);
    this.resetTextarea();
    this.cdr.markForCheck();
  }

  private async sendFiles(roomId: number): Promise<void> {
    this.sending.set(true);
    const files = this.pendingFiles();
    for (const pf of files) {
      try {
        const upload$ = pf.isImage
          ? this.mediaService.uploadImage(pf.file, roomId)
          : this.mediaService.uploadFile(pf.file, roomId);

        await new Promise<void>((resolve, reject) => {
          upload$.subscribe({
            next: (media) => {
              this.ws.sendMessage({
                type: "CHAT_MESSAGE",
                roomId,
                content: pf.file.name,
                messageType: pf.isImage ? "IMAGE" : "FILE",
                mediaUrl: media.url,
                replyToId: this.replyTarget()?.messageId,
              });
              resolve();
            },
            error: reject,
          });
        });
      } catch (e) {
        console.error("Upload failed", e);
      }
    }
    this.pendingFiles.set([]);
    if (this.messageText.trim()) {
      this.ws.sendMessage({
        type: "CHAT_MESSAGE",
        roomId,
        content: this.messageText.trim(),
        replyToId: this.replyTarget()?.messageId,
      });
      this.messageText = "";
    }
    this.replyTarget.set(null);
    this.sending.set(false);
    this.resetTextarea();
    this.cdr.markForCheck();
  }

  startEdit(msg: Message): void {
    this.editTarget.set(msg);
    this.replyTarget.set(null);
    this.messageText = msg.content || "";
    this.messageInput?.nativeElement.focus();
  }

  private submitEdit(content: string): void {
    const target = this.editTarget();
    if (!target) return;
    this.sending.set(true);
    this.messageService.editMessage(target.messageId, content).subscribe({
      next: (updated) => {
        this.messages.update((msgs) =>
          msgs.map((m) => (m.messageId === updated.messageId ? updated : m)),
        );
        this.rebuildGroups();
        this.editTarget.set(null);
        this.messageText = "";
        this.sending.set(false);
        this.ws.sendEdit({
          type: "MESSAGE_EDIT",
          roomId: this.room()!.roomId,
          messageId: target.messageId,
          newContent: content,
        });
        this.cdr.markForCheck();
      },
      error: () => this.sending.set(false),
    });
  }

  cancelEdit(): void {
    this.editTarget.set(null);
    this.messageText = "";
  }

  deleteMsg(msg: Message): void {
    if (!confirm("Delete this message for everyone?")) return;
    this.messageService.deleteMessage(msg.messageId, 'EVERYONE').subscribe({
      next: () => {
        this.messages.update((msgs) =>
          msgs.map((m) =>
            m.messageId === msg.messageId
              ? { ...m, isDeleted: true, content: "This message was deleted" }
              : m,
          ),
        );
        this.rebuildGroups();
        this.ws.sendDelete({
          type: "MESSAGE_DELETE",
          roomId: this.room()!.roomId,
          deletedId: msg.messageId,
          deleteType: "EVERYONE",
        });
        this.cdr.markForCheck();
      },
    });
  }

  deleteMsgForMe(msg: Message): void {
    if (!confirm("Delete this message for yourself?")) return;
    this.messageService.deleteMessage(msg.messageId, 'ME').subscribe({
      next: () => {
        // Remove from UI completely
        this.messages.update((msgs) =>
          msgs.filter((m) => m.messageId !== msg.messageId)
        );
        this.rebuildGroups();
        this.ws.sendDelete({
          type: "MESSAGE_DELETE",
          roomId: this.room()!.roomId,
          deletedId: msg.messageId,
          deleteType: "ME",
        });
        this.cdr.markForCheck();
      },
    });
  }

  sendReaction(messageId: string, emoji: string): void {
    const roomId = this.room()?.roomId;
    const userId = this.myId();
    if (!roomId || !userId) return;

    // Optimistic update: toggle/add/switch reaction immediately
    this.messages.update((msgs) =>
      msgs.map((m) => {
        if (m.messageId !== messageId) return m;
        const reactions = [...(m.reactions ?? [])];
        const existing = reactions.find((r) => r.userIds.includes(userId));
        if (existing) {
          if (existing.emoji === emoji) {
            // Toggle off
            const newUserIds = existing.userIds.filter((id) => id !== userId);
            if (newUserIds.length === 0) {
              return { ...m, reactions: reactions.filter((r) => r.emoji !== emoji) };
            }
            return { ...m, reactions: reactions.map((r) => r.emoji === emoji ? { ...r, count: newUserIds.length, userIds: newUserIds } : r) };
          } else {
            // Remove from old, add to new
            const cleaned = reactions.map((r) => {
              if (r.emoji === existing.emoji) {
                const newIds = r.userIds.filter((id) => id !== userId);
                return newIds.length ? { ...r, count: newIds.length, userIds: newIds } : null;
              }
              if (r.emoji === emoji) {
                const newIds = [...r.userIds, userId];
                return { ...r, count: newIds.length, userIds: newIds };
              }
              return r;
            }).filter(Boolean) as any[];
            const hasNew = cleaned.some((r) => r.emoji === emoji);
            if (!hasNew) cleaned.push({ emoji, count: 1, userIds: [userId] });
            return { ...m, reactions: cleaned };
          }
        } else {
          const existing2 = reactions.find((r) => r.emoji === emoji);
          if (existing2) {
            return { ...m, reactions: reactions.map((r) => r.emoji === emoji ? { ...r, count: r.userIds.length + 1, userIds: [...r.userIds, userId] } : r) };
          }
          return { ...m, reactions: [...reactions, { emoji, count: 1, userIds: [userId] }] };
        }
      })
    );
    this.rebuildGroups();
    this.cdr.markForCheck();

    // Send to backend via WebSocket
    this.ws.sendReact({
      type: "REACTION",
      roomId,
      messageId,
      emoji,
    });
  }

  setReply(msg: Message): void {
    this.replyTarget.set(msg);
    this.editTarget.set(null);
    this.messageInput?.nativeElement.focus();
  }

  getReplyAuthor(): string {
    const target = this.replyTarget();
    if (!target) return "";
    if (target.senderId === this.myId()) return "yourself";
    const member = this.members().find((m) => m.userId === target.senderId);
    return member?.user?.fullName || "someone";
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const id = Math.random().toString(36).slice(2);
      const previewUrl = isImage ? URL.createObjectURL(file) : "";
      this.pendingFiles.update((arr) => [
        ...arr,
        { id, file, isImage, previewUrl },
      ]);
    });
    input.value = "";
  }

  removeFile(id: string): void {
    this.pendingFiles.update((arr) => arr.filter((f) => f.id !== id));
  }

  insertEmoji(em: string): void {
    this.messageText += em;
    this.showEmojiPicker.set(false);
    this.messageInput?.nativeElement.focus();
  }

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
    if (!this.searchOpen()) this.searchQuery = "";
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery = "";
    const roomId = this.room()?.roomId;
    if (roomId) this.loadMessages(roomId, 0);
  }

  onSearch(): void {
    const roomId = this.room()?.roomId;
    if (!roomId || !this.searchQuery.trim()) {
      this.loadMessages(roomId!, 0);
      return;
    }
    const q = this.searchQuery.toLowerCase();
    const filtered = this.messages().filter((m) =>
      m.content?.toLowerCase().startsWith(q),
    );
    this.messages.set(filtered);
    this.rebuildGroups();
    this.cdr.markForCheck();
  }

  openLightbox(url: string): void {
    this.lightboxUrl.set(url);
  }
  onRoomAvatarUpdated(avatarUrl: string): void {
    this.room.update((r) =>
      r ? { ...r, avatarUrl: avatarUrl || undefined } : r,
    );
    this.cdr.markForCheck();
  }

  onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom && !this.isAtBottom) {
      const msgs = this.messages();
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== this.myId()) {
        this.ws.sendReadReceipt({
          type: "READ_RECEIPT",
          roomId: this.room()!.roomId,
          messageId: lastMsg.messageId,
        });
        // Persist lastReadAt via REST
        this.roomService.updateLastRead(this.room()!.roomId).subscribe({ error: () => {} });
      }
    }
    this.isAtBottom = atBottom;
  }


  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: "smooth" });
      this.shouldScrollBottom = false;
    } catch {}
  }

  private resetTextarea(): void {
    const ta = this.messageInput?.nativeElement;
    if (ta) ta.style.height = "auto";
  }

  canSend(): boolean {
    return this.messageText.trim().length > 0 || this.pendingFiles().length > 0;
  }

  roomName(): string {
    const r = this.room();
    if (!r) return "";
    return r.type === "DM" && r.otherUser
      ? r.otherUser.fullName || r.otherUser.username
      : r.name;
  }

  roomAvatarUrl(): string {
    const r = this.room();
    if (!r) return "";
    if (r.type === "DM" && r.otherUser) {
      if (r.otherUser.avatarUrl) return r.otherUser.avatarUrl;
      const initial = (r.otherUser.fullName || r.otherUser.username || "?")
        .charAt(0)
        .toUpperCase();
      const svg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#EDE8FF"/><text x="20" y="26" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="15" font-weight="700">${initial}</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    if (r.avatarUrl) return r.avatarUrl;
    const initial = (r.name || "?").charAt(0).toUpperCase();
    const svg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#EDE8FF"/><text x="20" y="26" text-anchor="middle" fill="#7C3AED" font-family="system-ui" font-size="15" font-weight="700">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  headerSubtitle(): string {
    const r = this.room();
    if (!r) return "";
    if (r.type === "DM")
      return this.presenceStatus() === "ONLINE" ? "Online" : "Offline";
    return `${r.memberCount || ""} members`;
  }

  otherUserStatus(): string {
    return this.presenceStatus().toLowerCase();
  }

  goBack(): void {
    this.router.navigate(["/chat"]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingUserTimers.forEach((t) => clearTimeout(t));
    this.pendingFiles().forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
  }
}
