'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const VAPID_KEY = 'BNm5Q99AoKtUfqGdGyH-NNJq-_N4ml3vkNousW0FbY2yntvHlxkuFcBtZsvDbLYxfPvSquPWpADdIlkGQnGnOEQ';

export default function NotificationButton({ mobile = false }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') setStatus('enabled');
    else if (Notification.permission === 'denied') setStatus('denied');
  }, [user]);

  async function handleClick() {
    if (!user) return;
    if (status === 'denied') {
      alert('Notifications are blocked. Go to browser Settings → Site Settings → Notifications → Allow this site.');
      return;
    }

    setStatus('requesting');
    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      // Clear old subscription
      try {
        const old = await reg.pushManager.getSubscription();
        if (old) await old.unsubscribe();
      } catch (_) {}

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return; }

      const { app } = await import('@/lib/firebase');
      const messaging = getMessaging(app);

      // Try with VAPID key
      let token = null;
      try {
        token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
      } catch (_) {
        token = await getToken(messaging, { serviceWorkerRegistration: reg });
      }

      if (!token) { setStatus('idle'); return; }

      await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
      setStatus('enabled');
    } catch (e) {
      console.error('FCM error:', e);
      setStatus('idle');
    }
  }

  if (!user) return null;

  // Mobile version — text button inside menu
  if (mobile) {
    return (
      <button
        onClick={handleClick}
        disabled={status === 'requesting'}
        className={`text-xs text-left flex items-center gap-2 ${status === 'enabled' ? 'text-green-400' : status === 'denied' ? 'text-red-400' : 'text-white'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {status === 'enabled' ? 'Notifications ON ✓' : status === 'requesting' ? 'Enabling...' : status === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
      </button>
    );
  }

  // Desktop version — icon button
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={status === 'requesting'}
        className={`p-2 rounded-lg transition-colors ${status === 'enabled' ? 'text-green-400' : status === 'denied' ? 'text-red-400' : status === 'requesting' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
        title={status === 'enabled' ? 'Notifications ON' : 'Enable notifications'}
      >
        {status === 'requesting' ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}
        {status === 'enabled' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
        )}
      </button>
    </div>
  );
}
