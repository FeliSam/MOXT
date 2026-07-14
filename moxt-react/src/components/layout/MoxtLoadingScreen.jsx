import { useEffect, useRef } from 'react'
import { LOADING_STUCK_MS } from './loadingRetry'

const SPLASH_SRC = '/assets/logos/Moxt-splash.png'

/**
 * Full-viewport boot / auth / route Suspense fallback with Moxt splash art.
 * When `autoRetry` is on, calls `onStuck` after {@link LOADING_STUCK_MS} so the
 * parent can soft-remount / re-trigger auth+data load.
 */
export function MoxtLoadingScreen({ autoRetry = true, onStuck } = {}) {
  const onStuckRef = useRef(onStuck)
  onStuckRef.current = onStuck
  const firedRef = useRef(false)

  useEffect(() => {
    if (!autoRetry || typeof onStuckRef.current !== 'function') return undefined
    firedRef.current = false
    const timer = window.setTimeout(() => {
      if (firedRef.current) return
      firedRef.current = true
      onStuckRef.current?.()
    }, LOADING_STUCK_MS)
    return () => window.clearTimeout(timer)
  }, [autoRetry])

  return (
    <div
      className="moxt-loading-screen grid min-h-dvh place-items-center bg-black px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement de MOXT"
    >
      <img
        src={SPLASH_SRC}
        alt="MOXT"
        width={720}
        height={1280}
        decoding="async"
        fetchPriority="high"
        className="moxt-loading-splash h-auto max-h-[min(88dvh,42rem)] w-auto max-w-[min(92vw,28rem)] object-contain"
      />
      <span className="sr-only">Chargement de MOXT…</span>
    </div>
  )
}
