import { useCallback } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { useStore } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import { softRefreshSession } from '../../services/authSessionSync'

/**
 * Indicateur pull-to-refresh (Safari / Capacitor). Monté dans le shell principal.
 * Visual language: teal glass orb + FiRefreshCw + ✨ accent (pull rotate → refresh spin).
 */
export function PullToRefreshIndicator({ disabled = false }) {
  const store = useStore()
  const { t } = useLanguage()

  const onRefresh = useCallback(async () => {
    await softRefreshSession(store)
  }, [store])

  const { pull, refreshing, progress, armed } = usePullToRefresh({
    onRefresh,
    disabled,
  })

  if (disabled || (pull <= 0 && !refreshing)) return null

  const translateY = refreshing ? 52 : Math.max(0, pull)
  const opacity = refreshing ? 1 : Math.min(1, 0.2 + progress * 0.8)
  const pullRotate = progress * 300
  const pullScale = 0.7 + progress * 0.35
  const glow = 0.2 + progress * 0.8

  const label = refreshing
    ? t('common.pullToRefresh.refreshing')
    : armed
      ? t('common.pullToRefresh.release')
      : t('common.pullToRefresh.pull')

  return (
    <div
      className="ptr-indicator pointer-events-none fixed inset-x-0 z-[var(--z-nav)] flex justify-center lg:hidden"
      style={{
        top: 'max(0.35rem, env(safe-area-inset-top, 0px))',
        transform: `translate3d(0, ${translateY}px, 0)`,
        opacity,
        transition:
          refreshing || pull === 0
            ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease'
            : undefined,
      }}
      role="status"
      aria-live="polite"
      aria-busy={refreshing}
      aria-label={label}
    >
      <div
        className={`ptr-orb ${armed && !refreshing ? 'ptr-orb--armed' : ''} ${
          refreshing ? 'ptr-orb--refreshing' : ''
        }`}
        style={
          refreshing
            ? undefined
            : {
                '--ptr-glow': String(glow),
                ...(armed ? null : { transform: `scale(${pullScale})` }),
              }
        }
      >
        <span className="ptr-orb__ring" aria-hidden="true" />
        <FiRefreshCw
          className="ptr-orb__icon"
          aria-hidden="true"
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${pullRotate}deg)` }
          }
        />
        <span className="ptr-orb__spark" aria-hidden="true">
          ✨
        </span>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
