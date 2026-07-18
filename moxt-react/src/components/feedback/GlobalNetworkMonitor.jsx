import { useEffect, useState } from 'react'
import { NetworkReconnectModal } from './NetworkReconnectModal'

/** Surveille le réseau sur toute l'app et propose de se reconnecter. */
export function GlobalNetworkMonitor() {
  const [open, setOpen] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  )

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

  return (
    <NetworkReconnectModal
      open={open}
      onClose={() => setOpen(false)}
      onRetry={() => window.location.reload()}
    />
  )
}
