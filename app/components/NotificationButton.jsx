'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { requestFCMToken } from '@/lib/fcm';

export default function NotificationButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle, requesting, enabled, denied
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if already enabled
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setStatus('enabled');
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      }
    }
  }, [user]);

  async function enableNotifications() {
    if (!user) {
      alert('Please login first');
      return;
    }

    setStatus('requesting');
    try {
      const token = await requestFCMToken(user.uid);
      if (token) {
        setStatus('enabled');
        alert('✅ Notifications enabled! You will receive updates even when browser is closed.');
      } else {
        setStatus('denied');
        alert('❌ Notification permission denied. Please enable in browser settings.');
      }
    } catch (e) {
      console.error('Error enabling notifications:', e);
      setStatus('idle');
      alert('Error enabling notifications. Check console for details.');
    }
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={enableNotifications}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={status === 'requesting' || status === 'enabled'}
        className={`p-2 rounded-lg transition-colors ${
          status === 'enabled' 
            ? 'text-green-400 hover:text-green-300' 
            : status === 'denied'
            ? 'text-red-400 hover:text-red-300'
            : 'text-gray-400 hover:text-white'
        }`}
        title={
          status === 'enabled' 
            ? 'Notifications enabled' 
            : status === 'denied'
            ? 'Notifications blocked'
            : 'Enable notifications'
        }
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

      {showTooltip && status !== 'enabled' && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-lg z-50">
          {status === 'denied' 
            ? 'Notifications blocked. Enable in browser settings.'
            : 'Click to enable push notifications'
          }
        </div>
      )}
    </div>
  );
}
