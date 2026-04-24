import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Message,
  MessageRequest,
  PagedResponse,
  DeliveryStatus,
} from "../models";

@Injectable({ providedIn: "root" })
export class MessageService {
  private readonly base = `${environment.apiBaseUrl}/api/messages`;

  constructor(private http: HttpClient) {}

  sendMessage(req: MessageRequest): Observable<Message> {
    const userStr = localStorage.getItem("talkifyx_user");
  
    if (!userStr) {
      throw new Error("User not found in localStorage");
    }
  
    const user = JSON.parse(userStr);
    const userId = user.id;
  
    if (!userId) {
      throw new Error("User ID missing in localStorage");
    }
  
    return this.http.post<Message>(this.base, req, {
      headers: {
        "X-User-Id": userId.toString(), 
      },
    });
  }

  getMessagesByRoom(
    roomId: number,
    page = 0,
    size = 20
  ): Observable<PagedResponse<Message>> {
    return this.http.get<PagedResponse<Message>>(
      `${this.base}/room/${roomId}`,
      {
        params: { page, size },
      }
    );
  }

  getMessagesBefore(roomId: number, before: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.base}/room/${roomId}/before`, {
      params: { before },
    });
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.base}/${messageId}`, null, {
      params: { content },
    });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${messageId}`);
  }

  searchMessages(roomId: number, keyword: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.base}/room/${roomId}/search`, {
      params: { keyword },
    });
  }

  getMessageCount(roomId: number): Observable<number> {
    return this.http.get<number>(`${this.base}/room/${roomId}/count`);
  }

  getUnreadMessages(roomId: number, after: string): Observable<number> {
    return this.http.get<number>(`${this.base}/room/${roomId}/unread`, {
      params: { after },
    });
  }

  updateDeliveryStatus(
    messageId: string,
    status: DeliveryStatus
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/${messageId}/status`, null, {
      params: { status },
    });
  }
}
