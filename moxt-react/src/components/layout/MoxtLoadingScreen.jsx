import { useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { LOADING_STUCK_MS } from './loadingRetry'

/** Query matches brand cache-bust style (`mark.png?v=…`); bump when replacing the PNG. */
const SPLASH_SRC = '/assets/logos/Moxt-splash.png?v=20260714'

/** Boot / splash canvas — must match Capacitor + theme-init reload background. */
export const MOXT_SPLASH_BG = '#000000'

function applyAppBackgroundFromTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  document.documentElement.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
  if (document.body) document.body.style.backgroundColor = ''
}

/**
 * Full-viewport boot / auth / route Suspense fallback with Moxt splash art.
 * When `autoRetry` is on, calls `onStuck` after {@link LOADING_STUCK_MS} so the
 * parent can soft-remount / re-trigger auth+data load.
 */
export function MoxtLoadingScreen({ autoRetry = true, onStuck } = {}) {
  const { t } = useLanguage()
  const onStuckRef = useRef(onStuck)
  onStuckRef.current = onStuck
  const firedRef = useRef(false)

  useEffect(() => {
    document.documentElement.style.backgroundColor = MOXT_SPLASH_BG
    if (document.body) document.body.style.backgroundColor = MOXT_SPLASH_BG
    return () => {
      applyAppBackgroundFromTheme()
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

  return (
    <div
      className="moxt-loading-screen fixed inset-0 z-[var(--z-modal)] grid min-h-dvh place-items-center px-4"
      style={{ backgroundColor: MOXT_SPLASH_BG }}
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
        className="moxt-loading-splash h-auto max-h-[min(88dvh,42rem)] w-auto max-w-[min(92vw,28rem)] object-contain"
      />
      <span className="sr-only">{t('common.loadingMoxtEllipsis')}</span>
    </div>
  )
}
