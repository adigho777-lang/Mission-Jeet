'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { onForegroundMessage } from '@/lib/fcm';

const VAPID_KEY = 'BNm5Q99AoKtUfqGdGyH-NNJq-_N4ml3vkNousW0FbY2yntvHlxkuFcBtZsvDbLYxfPvSquPWpADdIlkGQnGnOEQ';

// Auto-refreshes FCM token on every login if permission already granted
export default function NotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;

    const timer = setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const { app } = await import('@/lib/firebase');
        const messaging = getMessaging(app);

        let token = null;
        try {
          token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
        } catch (_) {
          token = await getToken(messaging, { serviceWorkerRegistration: reg });
        }

        if (token) {
          await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
          console.log('FCM token refreshed');
        }

        // Listen for foreground messages
        onForegroundMessage(() => {});
      } catch (e) {
        console.error('FCM auto-init error:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
