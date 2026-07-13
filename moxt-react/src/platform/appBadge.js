/** Met à jour le badge sur l’icône PWA (Safari iOS 16.4+, Chrome, etc.). */
export function syncAppBadge(count) {
  if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return
  const total = Math.max(0, Number(count) || 0)
  try {
    if (total > 0) {
      void navigator.setAppBadge(total > 99 ? 99 : total)
    } else {
      void navigator.clearAppBadge()
    }
  } catch {
    // API optionnelle — ignorer si indisponible.
  }
}

export function countUnreadCommunications(state, userId) {
  if (!userId) return 0
  const notifications = (state.communications?.notifications || []).filter(
    (item) => item.userId === userId && item.type !== 'message' && !item.archived && !item.read,
  ).length
  const messages = (state.communications?.conversations || [])
    .filter((conversation) => conversation.participantIds?.includes(userId))
    .reduce((total, conversation) => total + (conversation.unreadBy?.[userId] || 0), 0)
  return notifications + messages
}
