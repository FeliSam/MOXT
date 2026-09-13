/** Badge icône : PWA (Badging API) + Capacitor natif (iOS / Android). */

let nativeBadgePermissionTried = false

async function syncNativeAppBadge(total) {
  try {
    const { isNative } = await import('./capacitor')
    if (!isNative) return
    const { Badge } = await import('@capawesome/capacitor-badge')
    const supported = await Badge.isSupported().catch(() => ({ isSupported: true }))
    if (supported === false || supported?.isSupported === false) return

    if (!nativeBadgePermissionTried) {
      nativeBadgePermissionTried = true
      const current = await Badge.checkPermissions()
      if (current.display === 'prompt' || current.display === 'prompt-with-rationale') {
        await Badge.requestPermissions()
      }
    }
    const after = await Badge.checkPermissions()
    if (after.display && after.display !== 'granted') return

    const count = total > 99 ? 99 : total
    if (count > 0) {
      await Badge.set({ count })
      return
    }
    await Badge.clear()
  } catch (error) {
    console.warn('[MOXT] Badge icône natif', error)
  }
}

export function syncAppBadge(count) {
  if (typeof navigator === 'undefined') return
  const total = Math.max(0, Number(count) || 0)
  void syncNativeAppBadge(total)

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
  } catch {
    // API optionnelle — ignorer si indisponible.
  }
}

/** Force un badge à 0 (logout, session absente, boot). */
export function clearAppBadge() {
  nativeBadgePermissionTried = false
  syncAppBadge(0)
}

export function countUnreadCommunications(state, userId) {
  if (!userId) return 0
  const notifications = (state.communications?.notifications || []).filter(
    (item) => item.userId === userId && item.type !== 'message' && !item.archived && !item.read,
  ).length
  const messages = (state.communications?.conversations || [])
    .filter((conversation) => conversation.participantIds?.includes(userId))
    .reduce((sum, conversation) => sum + (conversation.unreadBy?.[userId] || 0), 0)
  return notifications + messages
}
