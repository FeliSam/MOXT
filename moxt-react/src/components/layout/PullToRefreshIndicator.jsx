import { useCallback } from 'react'
import { useStore } from 'react-redux'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import { softRefreshSession } from '../../services/authSessionSync'

/**
 * Indicateur pull-to-refresh (Safari / Capacitor). Monté dans le shell principal.
 */
export function PullToRefreshIndicator({ disabled = false }) {
  const store = useStore()

  const onRefresh = useCallback(async () => {
    await softRefreshSession(store)
  }, [store])

  const { pull, refreshing, progress, armed } = usePullToRefresh({
    onRefresh,
    disabled,
  })

  if (disabled || (pull <= 0 && !refreshing)) return null

  const translate = refreshing ? 48 : Math.max(0, pull)
  const opacity = refreshing ? 1 : Math.min(1, progress)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[var(--z-nav)] flex justify-center lg:hidden"
      style={{
        top: 'max(0.5rem, env(safe-area-inset-top, 0px))',
        transform: `translateY(${translate}px)`,
        opacity,
        transition: refreshing || pull === 0 ? 'transform 0.2s ease, opacity 0.2s ease' : undefined,
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--app-text-muted)] shadow-[var(--shadow-float)] backdrop-blur-md">
        <span
          className={`size-3.5 rounded-full border-2 border-[var(--app-accent)] border-t-transparent ${
            refreshing || armed ? 'animate-spin' : ''
          }`}
          style={{ opacity: refreshing ? 1 : 0.55 + progress * 0.45 }}
        />
        {refreshing ? 'Actualisation…' : armed ? 'Relâcher' : 'Tirer pour actualiser'}
      </div>
    </div>
  )
}
