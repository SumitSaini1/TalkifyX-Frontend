import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private app: FirebaseApp;
  private messaging: Messaging;

  constructor(private auth: AuthService) {
    this.app = getApps().length
      ? getApps()[0]
      : initializeApp(environment.firebase);
    this.messaging = getMessaging(this.app);
  }

  /**
   * Request notification permission, get FCM token, and save it to auth-service.
   * Call this once after the user logs in and the profile is loaded.
   */
  async initFcm(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
      });

      if (!token) return;

      // Persist to auth-service so the backend can send FCM pushes
      this.auth.updateProfile({ fcmToken: token }).subscribe({ error: () => {} });

      // Listen for foreground messages (in-app)
      onMessage(this.messaging, payload => {
        // Foreground messages arrive here; the app handles them via
        // WebSocket real-time updates so no extra action is needed.
        console.log('[FCM] foreground message', payload);
      });
    } catch (err) {
      console.warn('[FCM] init failed', err);
    }
  }
}
