importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCY6bDWC9kSZgRNwxJ0j878qZrXkivUGMY',
  authDomain: 'rutasegura-27846.firebaseapp.com',
  projectId: 'rutasegura-27846',
  storageBucket: 'rutasegura-27846.firebasestorage.app',
  messagingSenderId: '1015077074260',
  appId: '1:1015077074260:web:6d2023251b0a8ad93104c1',
});

const messaging = firebase.messaging();

// Notificaciones cuando el browser está en background o cerrado
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data ?? {},
  });
});
