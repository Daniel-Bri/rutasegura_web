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

    if (!('Notification' in window)) {
      console.warn('[Push] El browser no soporta notificaciones');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] El browser no soporta Service Workers');
      return;
    }

    try {
      // Pedir permiso
      const permission = await Notification.requestPermission();
      console.log('[Push] Permiso de notificaciones:', permission);
      if (permission !== 'granted') return;

      // Inicializar Firebase app
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Registrar el Service Worker de Firebase
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' },
      );
      console.log('[Push] Service Worker registrado:', registration.scope);

      // Obtener token FCM
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.warn('[Push] No se obtuvo token FCM');
        return;
      }

      console.log('[Push] Token FCM obtenido:', token.substring(0, 20) + '...');
      await this.registrarToken(token);
      this.initialized = true;

      // Notificación cuando la pestaña está activa (foreground)
      onMessage(messaging, (payload) => {
        console.log('[Push] Mensaje en foreground:', payload);
        const { title, body } = payload.notification ?? {};
        if (!title) return;
        registration.showNotification(title, {
          body: body ?? '',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data ?? {},
        });
      });

    } catch (err) {
      console.error('[Push] Error al inicializar:', err);
    }
  }

  private async registrarToken(token: string): Promise<void> {
    try {
      const authToken = localStorage.getItem('access_token');
      if (!authToken) {
        console.warn('[Push] Sin token de auth, no se puede registrar el token FCM');
        return;
      }
      await this.http.post(
        `${environment.apiUrl}/api/notificaciones/token`,
        { token, plataforma: 'web' },
        { headers: { Authorization: `Bearer ${authToken}` } },
      ).toPromise();
      console.log('[Push] Token FCM registrado en el backend');
    } catch (err) {
      console.error('[Push] Error al registrar token en backend:', err);
    }
  }
}
