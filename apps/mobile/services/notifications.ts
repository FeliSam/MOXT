import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

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
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
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
      lightColor: '#08705f',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch (error) {
    console.warn('[notifications] jeton push indisponible', error);
    return null;
  }
}

/** Enregistre le token de l'appareil dans la table Supabase `device_subscriptions` */
export async function syncDevicePushSubscription(userId: string, token: string): Promise<boolean> {
  if (!userId || !token || !supabase) return false;
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const { error } = await supabase.from('device_subscriptions').upsert(
      {
        user_id: userId,
        platform,
        endpoint: token,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' },
    );
    if (error) {
      console.warn('[notifications] Échec synchronisation device_subscriptions:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notifications] Exception synchronisation device_subscriptions:', err);
    return false;
  }
}

/** Met à jour la pastille (badge) de l'icône de l'application sur l'écran d'accueil */
export async function updateAppBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch (error) {
    console.warn('[notifications] Erreur mise à jour badge icône:', error);
  }
}

/** Affiche une notification locale (bannière système) */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
        channelId: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[notifications] Erreur affichage notification locale:', error);
  }
}

