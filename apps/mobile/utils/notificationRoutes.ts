import { resolveNativePath } from '@/utils/nativePath';

/** Traduit un lien de notification web vers une route Expo. */
export function mobileNotificationRoute(link: string | null | undefined, type?: string) {
  const native = resolveNativePath(link);
  if (native) return native;
  if (type === 'message' || String(link || '').startsWith('/messages')) return '/(tabs)/messages';
  return null;
}

export function isMessageNotification(notification: { type?: string; link?: string | null }) {
  return notification.type === 'message' || Boolean(notification.link?.startsWith('/messages'));
}
