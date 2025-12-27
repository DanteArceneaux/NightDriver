export interface SurgeAlert {
  zoneId: string;
  zoneName: string;
  oldScore: number;
  newScore: number;
  scoreDiff: number;
  reason: string;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show surge alert notification
 */
export function showSurgeNotification(surge: SurgeAlert) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification('🔥 SURGE ALERT!', {
    body: `${surge.zoneName} jumped to ${surge.newScore} (+${surge.scoreDiff})\n${surge.reason}`,
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    tag: 'surge-' + surge.zoneId,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });

  // Play sound
  try {
    const audio = new Audio('/surge-alert.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore audio errors
    });
  } catch (e) {
    // Ignore
  }

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
}

/**
 * Show a simple toast notification (fallback)
 */
export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  // This would integrate with a toast library in production
  console.log(`[${type.toUpperCase()}] ${message}`);
}

