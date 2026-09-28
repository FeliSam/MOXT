import {
  NOTIFICATIONS_FETCH_LIMIT,
  countUnreadNotifications,
  filterLoadedNotifications,
  notificationFromRemoteRow,
  selectVisibleNotificationList,
} from '../domain/notificationRules.js'
import { rowsOrThrow } from './rowUtils.js'

/** Même requête que le chargement web (loadAllData) : 50 dernières notifications du compte. */
export async function fetchNotifications(client, userId, { limit = NOTIFICATIONS_FETCH_LIMIT, starsEnabled = true } = {}) {
  if (!client || !userId) return []
  const result = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  const rows = rowsOrThrow(result, 'Notifications')
  return filterLoadedNotifications(rows.map(notificationFromRemoteRow), { starsEnabled })
}

/** Liste visible + compteur non lues (badge cloche), mêmes règles que les sélecteurs web. */
export async function fetchNotificationInbox(client, userId, options) {
  const items = await fetchNotifications(client, userId, options)
  return {
    items,
    visible: selectVisibleNotificationList(items, userId),
    unreadCount: countUnreadNotifications(items, userId),
  }
}

/**
 * Temps réel comme le web (realtimeService) : INSERT + UPDATE sur `notifications`
 * filtrés sur user_id. Renvoie une fonction de désabonnement.
 */
export function subscribeToNotifications(client, userId, onUpsert, { channelName } = {}) {
  if (!client?.channel || !userId) return () => {}
  const handle = (payload) => {
    const item = notificationFromRemoteRow(payload?.new)
    if (item?.id) onUpsert(item, payload?.eventType || payload?.type)
  }
  const channel = client
    .channel(channelName || `notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, handle)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, handle)
    .subscribe()
  return () => {
    try {
      client.removeChannel(channel)
    } catch {
      // canal déjà fermé
    }
  }
}

/** Même écriture que le web (supabaseMiddleware communications/markNotificationRead). */
export async function markNotificationRead(client, notificationId) {
  const { error } = await client
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)
  if (error) throw error
}

/** Même écriture que le web (communications/markAllNotificationsRead). */
export async function markAllNotificationsRead(client, userId) {
  const { error } = await client
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}
