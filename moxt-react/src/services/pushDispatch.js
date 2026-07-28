/**
 * Push est déclenché côté serveur (trigger notifications → send-push + secret).
 * Le client ne doit plus invoquer send-push sans secret (bypass « récente » retiré).
 */
export async function dispatchPushNotification(notificationId) {
  if (!notificationId) return { ok: false, reason: 'missing_id' }
  return { ok: true, skipped: 'server_trigger' }
}
