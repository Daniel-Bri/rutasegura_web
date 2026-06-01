import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '../../../environments/firebase.config';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private initialized = false;

  constructor(private http: HttpClient) {}

  async inicializar(): Promise<void> {
    if (this.initialized) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

      if (token) {
        await this.registrarToken(token);
        this.initialized = true;
      }

      // Notificaciones cuando la pestaña está activa (foreground)
      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        if (!title) return;
        if (Notification.permission === 'granted') {
          new Notification(title, { body: body ?? '', icon: '/favicon.ico' });
        }
      });
    } catch (err) {
      console.warn('[Push] No se pudo inicializar Firebase Messaging:', err);
    }
  }

  private async registrarToken(token: string): Promise<void> {
    try {
      const authToken = localStorage.getItem('access_token');
      if (!authToken) return;
      await this.http.post(
        `${environment.apiUrl}/api/notificaciones/token`,
        { token, plataforma: 'web' },
        { headers: { Authorization: `Bearer ${authToken}` } },
      ).toPromise();
    } catch { }
  }
}
