'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken } from '@/lib/fcm';

export default function NotificationButton() {
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
      alert('Notifications are blocked. Go to browser settings → Site settings → Notifications → Allow for this site.');
      return;
    }

    setStatus('requesting');
    try {
      const token = await requestFCMToken(user.uid);
      if (token) {
        setStatus('enabled');
        alert('Notifications enabled!');
      } else {
        setStatus('idle');
        alert('Could not enable notifications. Check browser console for details.');
      }
    } catch (e) {
      console.error('Notification error:', e);
      setStatus('idle');
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
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={status === 'requesting'}
        className={`p-2 rounded-lg transition-colors ${colors[status]}`}
        title={status === 'enabled' ? 'Notifications ON (click to refresh)' : status === 'denied' ? 'Notifications blocked' : 'Enable notifications'}
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
