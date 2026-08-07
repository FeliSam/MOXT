import { useEffect, useState } from 'react'

const TICK_MS = 30_000

/** Horloge client pour comptes à rebours — évite useSyncExternalStore (hydratation / removeChild). */
export function useLifecycleClock() {
  const [now, setNow] = useState(0)

  useEffect(() => {
    const update = () => setNow(Date.now())
    update()
    const timer = window.setInterval(update, TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  return now
}
