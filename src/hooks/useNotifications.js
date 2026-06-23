import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requestNotifyPermission } from '../utils/notify';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, FCM_VAPID_KEY } from '../../firebase';

function isCapacitorNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
}

export function useNotifications(onTokenReceived) {
  useEffect(() => {
    if (isCapacitorNative()) {
      // Request local notification permission for Android
      requestNotifyPermission();
    } else if (Platform.OS === 'web') {
      setupWebPush(onTokenReceived);
    }
  }, []);
}

async function setupWebPush(onTokenReceived) {
  try {
    if (!('Notification' in window)) return;
    const granted = await requestNotifyPermission();
    if (!granted) return;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY });
    if (token && onTokenReceived) onTokenReceived(token);

    onMessage(messaging, (payload) => {
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'MIST Mess', {
          body: payload.notification?.body,
          icon: '/favicon.png',
        });
      }
    });
  } catch (e) {
    console.warn('Web push setup error:', e);
  }
}
