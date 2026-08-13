import { useEffect, useState } from 'react'
import { NetworkReconnectModal } from './NetworkReconnectModal'
import { store } from '../../app/store'
import { softRefreshSession } from '../../services/authSessionSync'

/** Surveille le réseau sur toute l'app et propose de se reconnecter. */
export function GlobalNetworkMonitor() {
  const [open, setOpen] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  )
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const handleOffline = () => setOpen(true)
    const handleOnline = () => setOpen(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  async function handleRetry() {
    if (retrying) return
    setRetrying(true)
    try {
      await softRefreshSession(store)
      if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
        setOpen(false)
      }
    } catch {
      // Garder la modale ouverte — l'utilisateur peut réessayer ou fermer.
    } finally {
      setRetrying(false)
    }
  }

  return (
    <NetworkReconnectModal
      open={open}
      onClose={() => setOpen(false)}
      onRetry={handleRetry}
    />
  )
}
