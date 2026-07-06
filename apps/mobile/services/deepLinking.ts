import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';

type NotificationData = {
  type?: 'transfer' | 'parcel' | 'marketplace' | 'message' | 'system' | 'job';
  relatedId?: string;
};

function navigateFromNotification(data: NotificationData) {
  if (!data.type) {
    router.push('/notifications' as any);
    return;
  }

  switch (data.type) {
    case 'transfer':
      if (data.relatedId) router.push(`/transfer/${data.relatedId}` as any);
      else router.push('/(tabs)/transfers' as any);
      break;
    case 'parcel':
      if (data.relatedId) router.push(`/parcel/${data.relatedId}` as any);
      else router.push('/(tabs)/parcels' as any);
      break;
    case 'marketplace':
      if (data.relatedId) router.push(`/listing/${data.relatedId}` as any);
      else router.push('/(tabs)/marketplace' as any);
      break;
    case 'message':
      if (data.relatedId) router.push(`/messages/${data.relatedId}` as any);
      else router.push('/messages' as any);
      break;
    case 'job':
      if (data.relatedId) router.push(`/jobs/${data.relatedId}` as any);
      else router.push('/jobs' as any);
      break;
    default:
      router.push('/notifications' as any);
  }
}

export function useNotificationNavigation() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Handle notification tap when app is in foreground/background
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data || {}) as NotificationData;
      navigateFromNotification(data);
    });

    // Handle cold-start (app opened via notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = (response.notification.request.content.data || {}) as NotificationData;
        setTimeout(() => navigateFromNotification(data), 500);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}
