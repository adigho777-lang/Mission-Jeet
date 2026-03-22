'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken, onForegroundMessage } from '@/lib/fcm';

// Initialize FCM push notifications (works even when browser closed)
export default function NotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('⏸️ No user logged in, skipping FCM init');
      return;
    }

    console.log('🚀 Initializing FCM for user:', user.uid);

    // Small delay to avoid blocking page load
    const timer = setTimeout(async () => {
      try {
        // Request FCM token and save to Firestore
        console.log('📱 Requesting FCM token...');
        const token = await requestFCMToken(user.uid);
        if (token) {
          console.log('✅ Push notifications enabled for user:', user.uid);
        } else {
          console.log('❌ Failed to get FCM token');
        }

        // Listen for foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
          console.log('📬 Notification received:', payload);
        });

        return () => unsubscribe?.();
      } catch (e) {
        console.error('❌ Notification init failed:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}

