'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const VAPID_KEY = 'BNm5Q99AoKtUfqGdGyH-NNJq-_N4ml3vkNousW0FbY2yntvHlxkuFcBtZsvDbLYxfPvSquPWpADdIlkGQnGnOEQ';

export default function NotificationButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState('');

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') setStatus('enabled');
    else if (Notification.permission === 'denied') setStatus('denied');
  }, [user]);

  async function handleClick() {
    if (!user) { alert('Login first'); return; }
    if (status === 'denied') {
      alert('Notifications blocked. Go to browser Settings → Site Settings → Notifications → Allow this site.');
      return;
    }

    setStatus('requesting');
    setLog('Starting...');

    try {
      // Step 1: Service Worker
      setLog(p => p + '\n1. Registering SW...');
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      setLog(p => p + ' OK');

      // Step 2: SW Ready
      setLog(p => p + '\n2. Waiting for SW ready...');
      await navigator.serviceWorker.ready;
      setLog(p => p + ' OK');

      // Step 2b: Clear old push subscription (fixes "push service error")
      setLog(p => p + '\n2b. Clearing old push subscription...');
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        setLog(p => p + ' cleared');
      } else {
        setLog(p => p + ' none');
      }

      // Step 3: Permission
      setLog(p => p + '\n3. Requesting permission...');
      const perm = await Notification.requestPermission();
      setLog(p => p + ' ' + perm);
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }

      // Step 4: Firebase messaging
      setLog(p => p + '\n4. Init Firebase messaging...');
      const { app } = await import('@/lib/firebase');
      const messaging = getMessaging(app);
      setLog(p => p + ' OK');

      // Step 5: Get token
      setLog(p => p + '\n5. Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: reg,
      });
      setLog(p => p + ' ' + (token ? 'GOT TOKEN' : 'NO TOKEN'));

      if (!token) {
        setStatus('idle');
        alert('Failed to get FCM token. Check console.');
        return;
      }

      // Step 6: Save to Firestore
      setLog(p => p + '\n6. Saving to Firestore...');
      await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
      setLog(p => p + ' SAVED');

      setStatus('enabled');
      alert('Notifications enabled! Token saved.');

    } catch (e) {
      console.error('FCM Error:', e);
      setLog(p => p + '\nERROR: ' + e.message + ' | code: ' + e.code);
      setStatus('idle');
      alert('Error: ' + e.message);
    }
  }

  if (!user) return null;

  const colors = {
    enabled: 'text-green-400',
    denied: 'text-red-400',
    requesting: 'text-yellow-400',
    idle: 'text-gray-400 hover:text-white',
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={status === 'requesting'}
          className={`p-2 rounded-lg transition-colors ${colors[status]}`}
          title={status === 'enabled' ? 'Notifications ON (click to refresh)' : 'Enable notifications'}
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

      {/* Debug log — only shows when there's activity */}
      {log ? (
        <div className="fixed bottom-4 left-4 bg-black text-green-400 text-[11px] font-mono p-3 rounded-lg z-[9999] max-w-xs whitespace-pre-wrap shadow-xl">
          {log}
        </div>
      ) : null}
    </>
  );
}
