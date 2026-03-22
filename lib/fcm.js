// Firebase Cloud Messaging — Push Notifications (works even when browser closed)
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let messaging = null;

// Initialize FCM (only in browser)
export function initFCM() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const { app } = require('./firebase');
    messaging = getMessaging(app);
    return messaging;
  } catch (e) {
    console.error('FCM init failed:', e);
    return null;
  }
}

// Request permission and get FCM token
export async function requestFCMToken(userId) {
  if (!messaging) messaging = initFCM();
  if (!messaging) return null;

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered');

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BNm5Q99AoKtUfqGdGyH-NNJq-_N4ml3vkNousW0FbY2yntvHlxkuFcBtZsvDbLYxfPvSquPWpADdIlkGQnGnOEQ', // Replace with your VAPID key from Firebase Console
      serviceWorkerRegistration: registration,
    });

    console.log('FCM Token:', token);

    // Save token to Firestore
    if (userId && token) {
      await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
    }

    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for foreground messages (when app is open)
export function onForegroundMessage(callback) {
  if (!messaging) messaging = initFCM();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show notification even when app is open
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'Mission JEET', {
        body: payload.notification?.body || '',
        icon: '/mission-jeet.jpg',
        badge: '/mission-jeet.jpg',
        tag: payload.data?.classId || 'default',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });
    }
    
    if (callback) callback(payload);
  });
}

// Send notification via Firebase Admin SDK (call this from your backend/Cloud Function)
// This is just the structure — you'll need to implement the backend API
export async function sendPushNotification(fcmToken, title, body, data = {}) {
  // This should be called from your backend (Node.js/Cloud Function)
  // Frontend cannot send FCM messages directly for security reasons
  
  const message = {
    token: fcmToken,
    notification: { title, body },
    data: data,
    webpush: {
      notification: {
        icon: '/mission-jeet.jpg',
        badge: '/mission-jeet.jpg',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      },
    },
  };

  // Backend API call example:
  // await fetch('/api/send-notification', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(message),
  // });
  
  console.log('Send this from backend:', message);
  return message;
}
