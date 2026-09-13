import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { isNative } from '../platform/capacitor'
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

  useEffect(() => {
    if (!isNative || !userId) return undefined
    let handle
    let cancelled = false
    void import('@capacitor/app').then(({ App }) => {
      if (cancelled) return
      handle = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) syncAppBadge(unread)
      })
    })
    return () => {
      cancelled = true
      handle?.then((listener) => listener.remove())
    }
  }, [userId, unread])
}
