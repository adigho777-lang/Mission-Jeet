// Browser notification helpers

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Schedule a 5-min-before + on-start notification for a live class
export function scheduleNotifications(classData) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const start = classData.startTime?.toMillis?.() ?? Number(classData.startTime) ?? 0;
  if (!start) return;

  const now  = Date.now();
  const diff = start - now;

  // 5 min before
  const fiveMin = diff - 5 * 60 * 1000;
  if (fiveMin > 0) {
    setTimeout(() => {
      new Notification('Live class in 5 minutes', {
        body: classData.title ?? 'A live class is starting soon',
        icon: '/favicon.ico',
      });
    }, fiveMin);
  }

  // At start time
  if (diff > 0) {
    setTimeout(() => {
      new Notification('Live class started!', {
        body: classData.title ?? 'Join now',
        icon: '/favicon.ico',
      });
    }, diff);
  }
}
