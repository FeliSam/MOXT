import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { clearAppBadge, countUnreadCommunications, syncAppBadge } from '../platform/appBadge'

/** Synchronise le badge icône avec les messages + notifications non lus (live Redux / DB). */
export function useAppBadgeSync(userId) {
  const unread = useSelector((state) => countUnreadCommunications(state, userId))

  useEffect(() => {
    if (!userId) {
      clearAppBadge()
      return undefined
    }
    syncAppBadge(unread)
    return undefined
  }, [userId, unread])
}
