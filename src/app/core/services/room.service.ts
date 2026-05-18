import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { Room, RoomRequest, RoomMember } from "../models";

@Injectable({ providedIn: "root" })
export class RoomService {
  private readonly base = `${environment.apiBaseUrl}/api/rooms`;

  constructor(private http: HttpClient) {}

  createRoom(req: RoomRequest): Observable<Room> {
    return this.http.post<Room>(this.base, req);
  }

  getRoomById(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.base}/${id}`);
  }

  getRoomsByUser(userId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.base}/user/${userId}`);
  }

  updateRoom(id: number, req: Partial<RoomRequest>): Observable<Room> {
    return this.http.put<Room>(`${this.base}/${id}`, req);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addMember(roomId: number, userId: number): Observable<RoomMember> {
    return this.http.post<RoomMember>(`${this.base}/${roomId}/members`, null, {
      params: { userId },
    });
  }

  removeMember(roomId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${roomId}/members/${userId}`);
  }

  getMembers(roomId: number): Observable<RoomMember[]> {
    return this.http.get<RoomMember[]>(`${this.base}/${roomId}/members`);
  }

  updateMemberRole(
    roomId: number,
    userId: number,
    role: string,
  ): Observable<RoomMember> {
    return this.http.put<RoomMember>(
      `${this.base}/${roomId}/members/${userId}/role`,
      null,
      { params: { role } },
    );
  }

  muteUnmuteMember(
    roomId: number,
    userId: number,
    mute: boolean,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.base}/${roomId}/members/${userId}/mute`,
      null,
      { params: { mute } },
    );
  }

  getUnreadCountByDate(roomId: number, after: string): Observable<number> {
    return this.http
      .get<number>(
        `${environment.apiBaseUrl}/api/messages/room/${roomId}/unread`,
        { params: { after } },
      )
      .pipe(catchError(() => of(0)));
  }

  getUnreadCount(roomId: number, userId: number): Observable<number> {
    return this.http.get<number>(`${this.base}/${roomId}/unread/${userId}`);
  }

  updateLastRead(roomId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${roomId}/read`, null);
  }

  getLastMessage(roomId: number): Observable<any> {
    return this.http
      .get<any>(`${environment.apiBaseUrl}/api/messages/room/${roomId}`, {
        params: { page: 0, size: 1 },
      })
      .pipe(
        map((r: any) => {
          if (r?.content?.length) return r.content[0];
          if (Array.isArray(r) && r.length) return r[0];
          return null;
        }),
        catchError(() => of(null)),
      );
  }

  createDM(
    currentUserId: number,
    otherUserId: number,
    otherUsername: string,
  ): Observable<Room> {
    const req: RoomRequest = {
      name: `DM_${currentUserId}_${otherUserId}`,
      type: "DM",
      isPrivate: true,
    };
    return new Observable((observer) => {
      this.createRoom(req).subscribe({
        next: (room) => {
          this.addMember(room.roomId, otherUserId).subscribe({
            next: () => {
              this.getRoomById(room.roomId).subscribe({
                next: (fullRoom) => observer.next(fullRoom),
                error: () => observer.next(room)
              });
            },
            error: (err) => observer.error(err),
          });
        },
        error: (err) => observer.error(err),
      });
    });
  }
}
