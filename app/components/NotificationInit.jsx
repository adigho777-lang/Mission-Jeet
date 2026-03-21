'use client';

import { useEffect } from 'react';
import { initNotifications } from '@/lib/notifications';

// Mounts once, triggers browser notification permission popup after 3s
export default function NotificationInit() {
  useEffect(() => {
    initNotifications();
  }, []);
  return null;
}
