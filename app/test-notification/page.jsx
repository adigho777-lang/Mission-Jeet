'use client';

import { useState } from 'react';

export default function TestNotificationPage() {
  const [result, setResult] = useState('');

  async function testBrowserNotification() {
    try {
      setResult('Testing browser notification API...\n');
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setResult(prev => prev + '❌ Notifications not supported\n');
        return;
      }
      
      setResult(prev => prev + '✅ Notifications supported\n');
      
      // Check permission
      setResult(prev => prev + `Permission: ${Notification.permission}\n`);
      
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        setResult(prev => prev + `New permission: ${perm}\n`);
        if (perm !== 'granted') {
          setResult(prev => prev + '❌ Permission denied\n');
          return;
        }
      }
      
      // Show test notification
      const notification = new Notification('Test Notification', {
        body: 'This is a test from Mission JEET',
        icon: '/mission-jeet.jpg',
        badge: '/mission-jeet.jpg',
        tag: 'test',
        requireInteraction: false,
      });
      
      setResult(prev => prev + '✅ Browser notification shown!\n');
      
      notification.onclick = () => {
        setResult(prev => prev + '✅ Notification clicked!\n');
        notification.close();
      };
      
    } catch (e) {
      setResult(prev => prev + `❌ Error: ${e.message}\n`);
    }
  }

  async function testServiceWorker() {
    try {
      setResult('Testing service worker...\n');
      
      if (!('serviceWorker' in navigator)) {
        setResult(prev => prev + '❌ Service workers not supported\n');
        return;
      }
      
      setResult(prev => prev + '✅ Service workers supported\n');
      
      // Check registration
      const registrations = await navigator.serviceWorker.getRegistrations();
      setResult(prev => prev + `Found ${registrations.length} service worker(s)\n`);
      
      registrations.forEach((reg, i) => {
        setResult(prev => prev + `SW ${i + 1}: ${reg.active?.scriptURL || 'inactive'}\n`);
      });
      
      // Try to register
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      setResult(prev => prev + `✅ Service worker registered: ${reg.active?.state || 'installing'}\n`);
      
    } catch (e) {
      setResult(prev => prev + `❌ Error: ${e.message}\n`);
    }
  }

  async function testFCM() {
    try {
      setResult('Testing FCM...\n');
      
      const { initFCM, requestFCMToken } = await import('@/lib/fcm');
      
      const messaging = initFCM();
      if (!messaging) {
        setResult(prev => prev + '❌ FCM not initialized\n');
        return;
      }
      
      setResult(prev => prev + '✅ FCM initialized\n');
      
      const token = await requestFCMToken('test-user-id');
      if (token) {
        setResult(prev => prev + `✅ FCM Token: ${token.substring(0, 30)}...\n`);
      } else {
        setResult(prev => prev + '❌ Failed to get FCM token\n');
      }
      
    } catch (e) {
      setResult(prev => prev + `❌ Error: ${e.message}\n${e.stack}\n`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔔 Notification Testing</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testBrowserNotification}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Test Browser Notification
          </button>
          
          <button
            onClick={testServiceWorker}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            Test Service Worker
          </button>
          
          <button
            onClick={testFCM}
            className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
          >
            Test FCM
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Results:</h2>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
            {result || 'Click a button to test...'}
          </pre>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Notifications only work on HTTPS (not localhost)</li>
            <li>• Service worker must be registered</li>
            <li>• Permission must be granted</li>
            <li>• FCM requires valid token</li>
            <li>• Background notifications need service worker active</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
