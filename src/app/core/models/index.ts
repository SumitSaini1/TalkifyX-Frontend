// ===== AUTH MODELS =====
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  status: UserStatus;
  provider?: string;
  lastSeenAt?: string;
  createdAt?: string;
  fcmToken?: string;
}

export type UserStatus = 'ONLINE' | 'AWAY' | 'DND' | 'INVISIBLE';

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
  };
}

export interface ProfileUpdateRequest {
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  fcmToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
}

// ===== ROOM MODELS =====
export interface Room {
  roomId: number;
  name: string;
  description?: string;
  type: 'GROUP' | 'DM';
  createdById: number;
  avatarUrl?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  lastMessageAt?: string;
  createdAt?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessage?: Message;
  otherUser?: User;
}

export interface RoomRequest {
  name: string;
  description?: string;
  type: 'GROUP' | 'DM';
  avatarUrl?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface RoomMember {
  memberId: number;
  roomId: number;
  userId: number;
  role: 'ADMIN' | 'MEMBER';
  joinedAt?: string;
  lastReadAt?: string;
  isMuted?: boolean;
  user?: User;
}

// ===== MESSAGE MODELS =====
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'REACTION' | 'SYSTEM';
export type DeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  messageId: string;
  roomId: number;
  senderId: number;
  content?: string;
  type: MessageType;
  mediaUrl?: string;
  replyToMessageId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  deliveryStatus: DeliveryStatus;
  sentAt: string;
  editedAt?: string;
  senderName?: string;
  senderAvatar?: string;
  sender?: User;
  replyToMessage?: Message;
  reactions?: ReactionGroup[];
}

export interface MessageRequest {
  roomId: number;
  content?: string;
  type: MessageType;
  mediaUrl?: string;
  replyToMessageId?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: number[];
}

// ===== WEBSOCKET PAYLOADS =====
export interface ChatPayload {
  type: 'CHAT_MESSAGE' | 'TYPING_INDICATOR' | 'READ_RECEIPT' | 'REACTION' | 'MESSAGE_EDIT' | 'MESSAGE_DELETE';
  senderId?: number;
  roomId?: number;
  content?: string;
  replyToId?: string;
  messageId?: string;
  newContent?: string;
  deletedId?: string;
  emoji?: string;
}

export interface TypingPayload {
  senderId: number;
  roomId: number;
  isTyping: boolean;
}

export interface ReadReceiptPayload {
  readerId: number;
  roomId: number;
  upToMessageId: string;
}

export interface PresencePayload {
  userId: number;
  status: string;
  customMessage?: string;
}

// ===== PRESENCE MODELS =====
export interface PresenceRequest {
  userId: number;
  status: string;
  customMessage?: string;
  deviceType?: string;
  sessionId?: string;
}

export interface PresenceResponse {
  presenceId?: number;
  userId: number;
  status: string;
  customMessage?: string;
  deviceType?: string;
  sessionId?: string;
  connectedAt?: string;
  lastPingAt?: string;
}

// ===== MEDIA MODELS =====
export interface MediaFile {
  mediaId: string;
  uploaderId?: number;
  roomId?: number;
  messageId?: string;
  filename?: string;
  originalName?: string;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  sizeKb?: number;
  width?: number;
  height?: number;
  uploadedAt?: string;
}

// ===== NOTIFICATION MODELS =====
export type NotificationType = 'NEW_MESSAGE' | 'MENTION' | 'ROOM_INVITE' | 'SYSTEM';

export interface Notification {
  notificationId: string;
  recipientId: number;
  actorId?: number;
  type: NotificationType;
  title?: string;
  message?: string;
  roomId?: number;
  messageId?: string;
  isRead: boolean;
  createdAt: string;
  actor?: User;
}

export interface SendNotificationRequest {
  recipientId: number;
  actorId?: number;
  type: NotificationType;
  title?: string;
  message?: string;
  roomId?: number;
  messageId?: string;
}