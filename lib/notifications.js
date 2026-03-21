// Browser notification helpers

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  // This triggers the browser popup asking user to allow/block
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
      new Notification('Live class in 5 minutes \uD83D\uDD14', {
        body: classData.title ?? 'A live class is starting soon',
        icon: '/mission-jeet.jpg',
      });
    }, fiveMin);
  }

  // At start time
  if (diff > 0) {
    setTimeout(() => {
      new Notification('\uD83D\uDD34 Live class started!', {
        body: (classData.title ?? 'Join now') + ' — Join now!',
        icon: '/mission-jeet.jpg',
      });
    }, diff);
  }
}

// Call this once on app load to prompt user for permission
export function initNotifications() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    // Small delay so it doesn't fire instantly on page load
    setTimeout(() => {
      Notification.requestPermission();
    }, 3000);
  }
}
