// Firebase Cloud Messaging Service Worker v2
// This runs in background even when browser/tab is closed

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyArB2FOD3UgvotLVoVCr1Bz7Os4TbPZD8Y",
  authDomain: "mission-jeet-8f2f5.firebaseapp.com",
  projectId: "mission-jeet-8f2f5",
  storageBucket: "mission-jeet-8f2f5.firebasestorage.app",
  messagingSenderId: "1002047948820",
  appId: "1:1002047948820:web:5b6d1597f230299791ff01",
});

const messaging = firebase.messaging();

// Background message handler — runs even when app is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Mission JEET';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/mission-jeet.jpg',
    badge: '/mission-jeet.jpg',
    tag: payload.data?.classId || 'default',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/live-classes';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
