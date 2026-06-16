import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, FCM_VAPID_KEY } from '../../firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(onTokenReceived) {
  const notifListener  = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setupWebPush(onTokenReceived);
    } else {
      setupNativePush(onTokenReceived);
    }
    return () => {
      if (notifListener.current)   Notifications.removeNotificationSubscription(notifListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
}

async function setupNativePush(onTokenReceived) {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (onTokenReceived) onTokenReceived(tokenData.data);
  } catch (e) {
    console.warn('Push token error:', e);
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
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
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

export async function sendLocalNotification(title, body) {
  if (Platform.OS === 'web') {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } else {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  }
}
