// Firebase Messaging Service Worker (v12.9.0)
// This file reads its configuration from its own URL parameters to avoid hardcoding.

importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// Parse configuration from URL parameters
const params = new URL(location).searchParams;

const config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

// Standard Service Worker Lifecycle
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase
if (config.apiKey && config.appId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    if (payload.notification) {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/TTNoName.png',
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    }
  });
} else {
  console.error('[firebase-messaging-sw.js] Missing configuration parameters.');
}
