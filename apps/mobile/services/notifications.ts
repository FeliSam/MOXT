import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Clé VAPID éventuellement déclarée dans app.json (notification.vapidPublicKey). */
function hasVapidPublicKey(): boolean {
  const config = Constants.expoConfig as { notification?: { vapidPublicKey?: string } } | null;
  return Boolean(config?.notification?.vapidPublicKey);
}

export async function registerForPushNotifications(): Promise<string | null> {
  // Expo web : pas de jeton push sans clé VAPID (sinon getExpoPushTokenAsync lève
  // « You must provide notification.vapidPublicKey in app.json »). On ne demande rien.
  if (Platform.OS === 'web' && !hasVapidPublicKey()) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MOXT',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn('[notifications] jeton push indisponible', error);
    return null;
  }
}

export async function scheduleLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
