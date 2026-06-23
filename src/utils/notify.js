let _id = 1;

function isCapacitorNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
}

export async function requestNotifyPermission() {
  if (isCapacitorNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.warn('Local notification permission error:', e);
      return false;
    }
  }
  if (typeof Notification !== 'undefined') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export async function notify(title, body) {
  if (isCapacitorNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{ id: _id++, title, body }],
      });
    } catch (e) {
      console.warn('Local notification error:', e);
    }
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.png' });
  }
}
