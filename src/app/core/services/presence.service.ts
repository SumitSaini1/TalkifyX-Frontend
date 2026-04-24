import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PresenceRequest, PresenceResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly base = `${environment.apiBaseUrl}/api/presence`;

  constructor(private http: HttpClient) {}

  connect(req: PresenceRequest): Observable<PresenceResponse> {
    return this.http.post<PresenceResponse>(`${this.base}/connect`, req);
  }

  disconnect(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/disconnect`, null, { params: { sessionId } });
  }

  updateStatus(userId: number, status: string, customMessage?: string): Observable<PresenceResponse> {
    const params: any = { status };
    if (customMessage) params.customMessage = customMessage;
    return this.http.put<PresenceResponse>(`${this.base}/${userId}/status`, null, { params });
  }

  ping(sessionId: string): Observable<PresenceResponse> {
    return this.http.post<PresenceResponse>(`${this.base}/ping`, null, { params: { sessionId } });
  }

  getByUserId(userId: number): Observable<PresenceResponse> {
    return this.http.get<PresenceResponse>(`${this.base}/${userId}`);
  }

  getBulk(userIds: number[]): Observable<PresenceResponse[]> {
    return this.http.post<PresenceResponse[]>(`${this.base}/bulk`, userIds);
  }
}
