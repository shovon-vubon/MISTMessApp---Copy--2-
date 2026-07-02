import { useEffect } from 'react';
import { Platform } from 'react-native';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, FCM_VAPID_KEY } from '../../firebase';

function isCapacitorNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
}

export function useNotifications(onTokenReceived) {
  useEffect(() => {
    if (isCapacitorNative()) {
      setupNativePush(onTokenReceived);
    } else if (Platform.OS === 'web') {
      setupWebPush(onTokenReceived);
      console.log("Web push setup complete");
    }
  }, []);
}

async function setupNativePush(onTokenReceived) {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permission = await PushNotifications.requestPermissions();
    console.log("Permission:", permission);

    if (permission.receive !== 'granted') {
      console.log("Notification permission denied");
      return;
    }

    PushNotifications.addListener('registration', (token) => {
      console.log("FCM TOKEN:", token.value);

      if (token.value && onTokenReceived) {
        onTokenReceived(token.value);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.log("Registration error:", JSON.stringify(err));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log("Notification received:", notification);
    });
    await PushNotifications.register();
  } catch (e) {
    console.log("Native push setup error:", e);
  }
}

async function setupWebPush(onTokenReceived) {
  try {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

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
