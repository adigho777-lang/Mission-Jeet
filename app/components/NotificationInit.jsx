'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken, onForegroundMessage } from '@/lib/fcm';

export default function NotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Only auto-init if permission already granted
    if (Notification.permission !== 'granted') return;

    const timer = setTimeout(async () => {
      try {
        // Always refresh token on login to ensure it's valid
        const token = await requestFCMToken(user.uid);
        if (token) {
          console.log('Push notifications active');
        }

        // Listen for foreground messages
        const unsub = onForegroundMessage(() => {});
        return () => unsub?.();
      } catch (e) {
        console.error('Notification init error:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
