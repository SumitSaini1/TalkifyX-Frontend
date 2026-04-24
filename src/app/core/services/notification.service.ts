import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationType } from '../models';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiBaseUrl}/api/notifications`;

  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(userId: number, page = 0, size = 20): Observable<PageResponse<Notification>> {
    return this.http.get<PageResponse<Notification>>(`${this.base}/user/${userId}`, {
      params: { page, size }
    });
  }

  getUnreadCount(userId: number): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.base}/user/${userId}/unread`).pipe(
      tap(r => this.unreadCount.set(r.unreadCount))
    );
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.base}/${notificationId}/read`, null);
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/user/${userId}/read-all`, null).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  delete(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${notificationId}`);
  }
}
