import { Injectable, OnDestroy } from "@angular/core";
import { Subject, Observable } from "rxjs";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { environment } from "../../../environments/environment";
import { AuthService } from "./auth.service";
import {
  ChatPayload,
  TypingPayload,
  ReadReceiptPayload,
  PresencePayload,
  Message,
} from "../models";

export type WsEvent =
  | { kind: "MESSAGE"; data: Message }
  | { kind: "TYPING"; data: TypingPayload }
  | { kind: "READ"; data: ReadReceiptPayload }
  | { kind: "REACTION"; data: ChatPayload }
  | { kind: "MSG_EDIT"; data: ChatPayload }
  | { kind: "MSG_DELETE"; data: ChatPayload }
  | { kind: "PRESENCE"; data: PresencePayload }
  | { kind: "NEW_ROOM"; data: any }
  | { kind: "ROOM_UPDATED"; data: any }
  | { kind: "CONNECTED" }
  | { kind: "DISCONNECTED" };

@Injectable({ providedIn: "root" })
export class WebSocketService implements OnDestroy {
  private client!: Client;
  private subscriptions = new Map<string, StompSubscription>();
  private roomSubscriptions = new Map<number, StompSubscription>();

  private events$ = new Subject<WsEvent>();
  readonly events: Observable<WsEvent> = this.events$.asObservable();

  private connected = false;

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.connected) return;
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`,
        "X-User-Id": String(userId),
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        this.events$.next({ kind: "CONNECTED" });
        this.subscribeToPresence();
        this.subscribeToUserQueue(userId);
      },
      onDisconnect: () => {
        this.connected = false;
        this.events$.next({ kind: "DISCONNECTED" });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.roomSubscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions.clear();
    this.roomSubscriptions.clear();
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.connected = false;
  }

  subscribeToRoom(roomId: number): void {
    if (this.roomSubscriptions.has(roomId)) return;
    if (!this.connected) {
      // Queue subscription until CONNECTED fires
      const unsub = this.events$.subscribe((evt) => {
        if (evt.kind === "CONNECTED") {
          unsub.unsubscribe();
          this.subscribeToRoom(roomId);
        }
      });
      return;
    }
    const sub = this.client.subscribe(
      `/topic/room/${roomId}`,
      (msg: IMessage) => {
        this.handleRoomMessage(msg);
      },
    );
    this.roomSubscriptions.set(roomId, sub);
  }

  unsubscribeFromRoom(roomId: number): void {
    const sub = this.roomSubscriptions.get(roomId);
    if (sub) {
      sub.unsubscribe();
      this.roomSubscriptions.delete(roomId);
    }
  }

  private subscribeToPresence(): void {
    const sub = this.client.subscribe("/topic/presence", (msg: IMessage) => {
      const data: PresencePayload = JSON.parse(msg.body);
      this.events$.next({ kind: "PRESENCE", data });
    });
    this.subscriptions.set("presence", sub);
  }

  private subscribeToUserQueue(userId: number): void {
    const sub = this.client.subscribe(
      `/topic/user/${userId}`,
      (msg: IMessage) => {
        // Route through handleRoomMessage so all event types are detected correctly
        this.handleRoomMessage(msg);
      },
    );
    this.subscriptions.set(`user-${userId}`, sub);
  }

  private handleRoomMessage(msg: IMessage): void {
    try {
      const data = JSON.parse(msg.body);
      console.log("[WS] raw frame:", JSON.stringify(data));

      if (data.eventType === "NEW_ROOM") {
        this.events$.next({ kind: "NEW_ROOM", data });
      } else if (data.eventType === "ROOM_UPDATED") {
        this.events$.next({ kind: "ROOM_UPDATED", data });
      } else if (data.eventType === "MESSAGE") {
        this.events$.next({ kind: "MESSAGE", data: data as Message });
      } else if (data.type === "READ_RECEIPT" || data.readerId !== undefined) {
        this.events$.next({ kind: "READ", data: data as ReadReceiptPayload });
      } else if (data.type === "MESSAGE_EDIT") {
        this.events$.next({ kind: "MSG_EDIT", data });
      } else if (data.type === "MESSAGE_DELETE") {
        this.events$.next({ kind: "MSG_DELETE", data });
      } else if (data.type === "REACTION") {
        this.events$.next({ kind: "REACTION", data });
      } else if (
        data.isTyping !== undefined ||
        (data.senderId && data.roomId && !data.content && !data.messageId)
      ) {
        this.events$.next({ kind: "TYPING", data: data as TypingPayload });
      }
    } catch (e) {
      console.error("[WS] parse error", e);
    }
  }
  sendMessage(payload: ChatPayload): void {
    if (!this.connected) return;
    const user = this.auth.currentUser();
    console.log("[WS] currentUser:", user);
    const body = JSON.stringify({
      ...payload,
      senderName: user?.fullName,
      senderAvatar: user?.avatarUrl,
    });
    console.log("[WS] sending body:", body);
    this.client.publish({
      destination: "/app/chat.send",
      headers: { "X-User-Id": String(this.auth.getUserId()) },
      body,
    });
  }

  sendTyping(payload: ChatPayload): void {
    if (!this.connected) return;
    this.client.publish({
      destination: "/app/chat.typing",
      headers: { "X-User-Id": String(this.auth.getUserId()) },
      body: JSON.stringify(payload),
    });
  }

  sendEdit(payload: ChatPayload): void {
    if (!this.connected) return;
    this.client.publish({
      destination: "/app/chat.edit",
      headers: { "X-User-Id": String(this.auth.getUserId()) },
      body: JSON.stringify(payload),
    });
  }

  sendDelete(payload: ChatPayload): void {
    if (!this.connected) return;
    this.client.publish({
      destination: "/app/chat.delete",
      headers: { "X-User-Id": String(this.auth.getUserId()) },
      body: JSON.stringify(payload),
    });
  }

  sendReadReceipt(payload: ChatPayload): void {
    if (!this.connected) return;
    this.client.publish({
      destination: "/app/chat.read",
      headers: { "X-User-Id": String(this.auth.getUserId()) },
      body: JSON.stringify(payload),
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
