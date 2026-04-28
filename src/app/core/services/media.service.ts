import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaFile } from '../models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly base = `${environment.apiBaseUrl}/api/media`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File, roomId: number, messageId?: string): Observable<MediaFile> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('roomId', String(roomId));
    if (messageId) fd.append('messageId', messageId);
    return this.http.post<MediaFile>(`${this.base}/upload`, fd);
  }

  uploadImage(file: File, roomId?: number, messageId?: string): Observable<MediaFile> {
  const fd = new FormData();
  fd.append('file', file);

  if (roomId !== undefined) {
    fd.append('roomId', String(roomId));
  }

  if (messageId) {
    fd.append('messageId', messageId);
  }

  return this.http.post<MediaFile>(`${this.base}/upload/image`, fd);
}

  getById(mediaId: string): Observable<MediaFile> {
    return this.http.get<MediaFile>(`${this.base}/${mediaId}`);
  }

  getByRoom(roomId: number): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(`${this.base}/room/${roomId}`);
  }

  deleteFile(mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${mediaId}`);
  }

  isImage(mimeType?: string): boolean {
    return !!mimeType?.startsWith('image/');
  }

  formatSize(kb?: number): string {
    if (!kb) return '';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }
}
