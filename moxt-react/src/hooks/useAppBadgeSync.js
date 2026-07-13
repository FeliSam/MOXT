import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { countUnreadCommunications, syncAppBadge } from '../platform/appBadge'

/** Synchronise le badge PWA avec les messages + notifications non lus. */
export function useAppBadgeSync(userId) {
  const unread = useSelector((state) => countUnreadCommunications(state, userId))

  useEffect(() => {
    syncAppBadge(unread)
  }, [unread])
}
