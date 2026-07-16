/** Met à jour le badge sur l’icône PWA / WebView (Safari iOS 16.4+, Chrome, etc.). */

async function clearNativeDeliveredNotifications() {
  try {
    const { isNative } = await import('./capacitor')
    if (!isNative) return
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.removeAllDeliveredNotifications()
  } catch {
    // Optionnel — native push peut être indisponible.
  }
}

export function syncAppBadge(count) {
  if (typeof navigator === 'undefined') return
  const total = Math.max(0, Number(count) || 0)

  try {
    if (total > 0) {
      if ('setAppBadge' in navigator) {
        void navigator.setAppBadge(total > 99 ? 99 : total)
      }
      return
    }

    if ('clearAppBadge' in navigator) {
      void navigator.clearAppBadge()
    } else if ('setAppBadge' in navigator) {
      void navigator.setAppBadge(0)
    }
    void clearNativeDeliveredNotifications()
  } catch {
    // API optionnelle — ignorer si indisponible.
  }
}

/** Force un badge à 0 (logout, session absente, boot). */
export function clearAppBadge() {
  syncAppBadge(0)
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
