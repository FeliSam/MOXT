import { useEffect, useState } from 'react'
import { NetworkReconnectModal } from './NetworkReconnectModal'
import { store } from '../../app/store'
import { NATIVE_RESUME_EVENT } from '../../platform/capacitor'
import { softRefreshSession } from '../../services/authSessionSync'
import {
  OFFLINE_CONFIRM_MS,
  shouldCloseNetworkModal,
  shouldIgnoreOfflineSignal,
} from './networkMonitor'

/** Surveille le réseau sur toute l'app et propose de se reconnecter. */
export function GlobalNetworkMonitor() {
  const [open, setOpen] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let offlineTimer = null

    function clearOfflineTimer() {
      if (offlineTimer) {
        window.clearTimeout(offlineTimer)
        offlineTimer = null
      }
    }

    function dismissIfOnline() {
      if (shouldCloseNetworkModal()) {
        clearOfflineTimer()
        setOpen(false)
      }
    }

    function handleOffline() {
      if (shouldIgnoreOfflineSignal()) return
      clearOfflineTimer()
      offlineTimer = window.setTimeout(() => {
        offlineTimer = null
        if (shouldIgnoreOfflineSignal()) return
        if (shouldCloseNetworkModal()) return
        setOpen(true)
      }, OFFLINE_CONFIRM_MS)
    }

    function handleOnline() {
      dismissIfOnline()
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') dismissIfOnline()
    }

    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine === false &&
      !shouldIgnoreOfflineSignal()
    ) {
      handleOffline()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener(NATIVE_RESUME_EVENT, dismissIfOnline)
    return () => {
      clearOfflineTimer()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener(NATIVE_RESUME_EVENT, dismissIfOnline)
    }
  }, [])

  async function handleRetry() {
    if (retrying) return
    setRetrying(true)
    try {
      await softRefreshSession(store)
      if (shouldCloseNetworkModal()) {
        setOpen(false)
      }
    } catch {
      // Garder la modale ouverte — l'utilisateur peut réessayer ou fermer.
    } finally {
      setRetrying(false)
    }
  }

  return <NetworkReconnectModal open={open} onClose={() => setOpen(false)} onRetry={handleRetry} />
}
