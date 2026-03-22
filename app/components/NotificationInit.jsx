'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken, onForegroundMessage } from '@/lib/fcm';

// Initialize FCM push notifications (works even when browser closed)
// This runs automatically on login, but users can also manually trigger via bell icon
export default function NotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('⏸️ No user logged in, skipping FCM auto-init');
      return;
    }

    // Check if user already has permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        console.log('🚀 Auto-initializing FCM for user:', user.uid);
        
        // Small delay to avoid blocking page load
        const timer = setTimeout(async () => {
          try {
            const token = await requestFCMToken(user.uid);
            if (token) {
              console.log('✅ Push notifications auto-enabled for user:', user.uid);
            }

            // Listen for foreground messages
            const unsubscribe = onForegroundMessage((payload) => {
              console.log('📬 Notification received:', payload);
            });

            return () => unsubscribe?.();
          } catch (e) {
            console.error('❌ Notification auto-init failed:', e);
          }
        }, 2000);

        return () => clearTimeout(timer);
      } else {
        console.log('🔔 Notification permission not granted yet. User can click bell icon to enable.');
      }
    }
  }, [user]);

  return null;
}
