import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/useLanguage'

/**
 * Lightweight full-viewport loader (spinner only) — no brand splash art.
 * Used for route Suspense, invite redirects, and post-boot auth waits.
 */
export function AppLoadingFallback({ label } = {}) {
  const { t } = useLanguage()
  const text = label || t('common.loading')

  const screen = (
    <div
      className="moxt-app-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={text}
    >
      <span className="moxt-app-loading-spinner" aria-hidden />
      <span className="moxt-app-loading-label">{text}</span>
    </div>
  )

  if (typeof document === 'undefined') return screen
  return createPortal(screen, document.body)
}
