// Client-side live class notification scheduler
// Runs in browser, checks every minute for upcoming classes

import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let intervalId = null;
let lastCheck = 0;

export function startLiveClassNotifier(user) {
  if (!user || intervalId) return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  console.log('🔔 Live class notifier started');

  // Check immediately
  checkAndNotify(user);

  // Then check every minute
  intervalId = setInterval(() => checkAndNotify(user), 60000);
}

export function stopLiveClassNotifier() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🔕 Live class notifier stopped');
  }
}

async function checkAndNotify(user) {
  try {
    const now = Date.now();
    
    // Don't check more than once per minute
    if (now - lastCheck < 55000) return;
    lastCheck = now;

    // Get upcoming classes (not completed, start time in future)
    const snap = await getDocs(
      query(
        collection(db, 'liveClasses'),
        where('completed', '==', false)
      )
    );

    const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    for (const cls of classes) {
      const startMs = cls.startTime?.toMillis?.() ?? Number(cls.startTime) ?? 0;
      if (!startMs || startMs < now) continue;

      const diffMin = Math.floor((startMs - now) / 60000);

      // Determine notification type
      let notifType = null;
      if (diffMin === 60) notifType = '1hr';
      else if (diffMin === 5) notifType = '5min';
      else if (diffMin === 0) notifType = 'start';

      if (!notifType) continue;

      // Check if already notified (localStorage)
      const notifKey = `notif_${cls.id}_${notifType}`;
      if (localStorage.getItem(notifKey)) continue;

      // Check if user should receive this notification
      const userProfile = user.profile || {};
      const shouldNotify = 
        !cls.category || 
        !userProfile.classType || 
        userProfile.classType.toLowerCase() === cls.category.toLowerCase();

      if (!shouldNotify) continue;

      // Send browser notification
      const titles = {
        '1hr': `⏰ 1 Hour to Go — ${cls.title}`,
        '5min': `⚡ Starting in 5 Min — ${cls.title}`,
        'start': `🔴 Live Now — ${cls.title}`,
      };
      const bodies = {
        '1hr': `${cls.batchName || 'Live class'} starts in 1 hour. Get ready!`,
        '5min': `${cls.batchName || 'Live class'} is starting in 5 minutes. Join now!`,
        'start': `${cls.batchName || 'Live class'} has started! Join now.`,
      };

      new Notification(titles[notifType], {
        body: bodies[notifType],
        icon: '/mission-jeet.jpg',
        badge: '/mission-jeet.jpg',
        tag: cls.id,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: cls.videoUrl || '/live-classes' },
      }).onclick = function() {
        window.focus();
        if (cls.videoUrl) window.open(cls.videoUrl, '_blank');
        else window.location.href = '/live-classes';
        this.close();
      };

      // Mark as notified
      localStorage.setItem(notifKey, Date.now());

      // Also send via FCM if token exists
      if (userProfile.fcmToken) {
        try {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fcmToken: userProfile.fcmToken,
              title: titles[notifType],
              body: bodies[notifType],
              data: { classId: cls.id, url: cls.videoUrl || '/live-classes' },
            }),
          });
        } catch (e) {
          console.error('FCM send failed:', e);
        }
      }
    }
  } catch (e) {
    console.error('Live class notifier error:', e);
  }
}
