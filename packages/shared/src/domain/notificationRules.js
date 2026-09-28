/**
 * Règles notifications partagées web + mobile (source unique).
 * Même filtrage que le chargement web (loadAllData) et les sélecteurs
 * selectVisibleNotifications / selectUnreadNotificationCount.
 */

export const NOTIFICATIONS_FETCH_LIMIT = 50

/** Ligne Supabase `notifications` → objet camelCase (même forme que le web). */
export function notificationFromRemoteRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId ?? row.user_id ?? null,
    title: row.title || '',
    message: row.message ?? row.body ?? '',
    type: row.type || 'system',
    link: row.link || null,
    priority: row.priority || 'normal',
    read: row.read === true,
    archived: row.archived === true,
    createdAt: row.createdAt ?? row.created_at ?? null,
  }
}

/** Filtre appliqué au chargement web : pas de type « message », « stars » seulement si le module est actif. */
export function filterLoadedNotifications(items = [], { starsEnabled = true } = {}) {
  return items
    .filter(Boolean)
    .filter((item) => item.type !== 'message')
    .filter((item) => starsEnabled || item.type !== 'stars')
}

export function isVisibleNotification(item, userId) {
  return Boolean(item) && String(item.userId) === String(userId) && item.type !== 'message' && !item.archived
}

export function selectVisibleNotificationList(items = [], userId) {
  return items
    .filter((item) => isVisibleNotification(item, userId))
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
}

export function countUnreadNotifications(items = [], userId) {
  return selectVisibleNotificationList(items, userId).filter((item) => !item.read).length
}

/** Fusion temps réel (INSERT/UPDATE) : remplace par id, ajoute sinon. */
export function upsertNotification(items = [], incoming) {
  if (!incoming?.id) return items
  const index = items.findIndex((item) => item.id === incoming.id)
  if (index === -1) return [incoming, ...items]
  const next = items.slice()
  next[index] = { ...items[index], ...incoming }
  return next
}
