import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { LOADING_STUCK_MS } from './loadingRetry'

/** Query matches brand cache-bust style (`mark.png?v=…`); bump when replacing the PNG. */
const SPLASH_SRC = '/assets/logos/Moxt-splash.png?v=20260714'

const SPLASH_LOCK_CLASS = 'moxt-splash-lock'

/**
 * Full-viewport boot / auth / route Suspense fallback with Moxt splash art.
 * Overlay is splash-scoped (portal + CSS); does not alter theme-init / ThemeContext /
 * Capacitor chrome. While mounted, `moxt-splash-lock` keeps html/body solid white so
 * mobile Safari/Chrome cannot flash mismatched app bg in safe-area / overscroll gaps.
 * When `autoRetry` is on, calls `onStuck` after {@link LOADING_STUCK_MS} so the
 * parent can soft-remount / re-trigger auth+data load.
 */
export function MoxtLoadingScreen({ autoRetry = true, onStuck } = {}) {
  const { t } = useLanguage()
  const onStuckRef = useRef(onStuck)
  onStuckRef.current = onStuck
  const firedRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add(SPLASH_LOCK_CLASS)
    return () => {
      document.documentElement.classList.remove(SPLASH_LOCK_CLASS)
    }
  }, [])

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

  const screen = (
    <div
      className="moxt-loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('common.loadingMoxt')}
    >
      <img
        src={SPLASH_SRC}
        alt="MOXT"
        width={720}
        height={1280}
        decoding="async"
        fetchPriority="high"
        className="moxt-loading-splash"
      />
      <span className="sr-only">{t('common.loadingMoxtEllipsis')}</span>
    </div>
  )

  if (typeof document === 'undefined') return screen
  return createPortal(screen, document.body)
}
