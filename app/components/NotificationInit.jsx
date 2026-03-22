'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken, onForegroundMessage } from '@/lib/fcm';

// Initialize FCM push notifications (works even when browser closed)
export default function NotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Small delay to avoid blocking page load
    const timer = setTimeout(async () => {
      try {
        // Request FCM token and save to Firestore
        const token = await requestFCMToken(user.uid);
        if (token) {
          console.log('✅ Push notifications enabled');
        }

        // Listen for foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
          console.log('📬 Notification received:', payload);
        });

        return () => unsubscribe?.();
      } catch (e) {
        console.error('Notification init failed:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}

