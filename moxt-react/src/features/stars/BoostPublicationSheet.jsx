import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiTrendingUp, FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { DEFAULT_QUOTA_CONFIG } from './starsConfig'
import { resolveBoostCost } from './starsPricing'
import { BOOST_DURATIONS } from './publicationBoostUtils'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

const DURATION_LABEL = {
  '24h': 'stars.duration24h',
  '3d': 'stars.duration3d',
  '7d': 'stars.duration7d',
}

export function BoostPublicationSheet({
  open,
  entityType,
  entityLabel = '',
  onClose,
  onSelect,
  loading = false,
  config = DEFAULT_QUOTA_CONFIG,
}) {
  const { t } = useLanguage()
  const starsEnabled = useStarsModuleEnabled()

  useEffect(() => {
    if (!open || !starsEnabled) return undefined
    function onKey(event) {
      if (event.key === 'Escape' && !loading) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [loading, onClose, open, starsEnabled])

  if (!starsEnabled || !open || !entityType) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] overscroll-none">
      <button
        type="button"
        aria-label={t('stars.boost.cancel')}
        onClick={() => {
          if (!loading) onClose?.()
        }}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px] dark:bg-black/45"
      />

      <div className="absolute inset-x-0 bottom-0 grid max-h-[min(88dvh,40rem)] place-items-stretch p-0 sm:inset-0 sm:place-items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="scrollbar-hidden w-full max-h-[min(88dvh,40rem)] overflow-y-auto overscroll-contain rounded-t-[1.6rem] border border-b-0 border-[var(--app-border)]/80 bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card-lg)] sm:max-w-md sm:rounded-[1.5rem] sm:border-b"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          data-navbar-ignore
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--app-border-md)] sm:hidden" aria-hidden />

          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <FiTrendingUp aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-[var(--app-text)]">{t('stars.boost.title')}</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {t('stars.boost.description', { label: entityLabel })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!loading) onClose?.()
              }}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)] sm:hidden"
              aria-label={t('stars.boost.cancel')}
            >
              <FiX aria-hidden />
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {BOOST_DURATIONS.map((durationKey) => {
              const cost = resolveBoostCost({ entityType, durationKey, config })
              return (
                <button
                  key={durationKey}
                  type="button"
                  disabled={loading}
                  onClick={() => onSelect?.(durationKey)}
                  className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] px-4 py-3 text-left transition hover:border-brand-400 hover:bg-[var(--app-surface-muted)] disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-black text-[var(--app-text)]">
                      {t(DURATION_LABEL[durationKey])}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--app-text-faint)]">
                      {t('stars.boost.feedHint')}
                    </span>
                  </span>
                  <span className="font-display text-lg font-black tabular-nums text-brand-700 dark:text-brand-400">
                    {t('stars.formulas.costStars', { n: cost })}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!loading) onClose?.()
            }}
            disabled={loading}
            className="mt-4 hidden w-full rounded-xl py-2.5 text-sm font-bold text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] sm:block"
          >
            {t('stars.boost.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function useStarsBoostFlow() {
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingQuote, setPendingQuote] = useState(null)
  const [resolver, setResolver] = useState(null)

  const confirmPaid = useCallback(
    (quote) =>
      new Promise((resolve) => {
        setPendingQuote(quote)
        setResolver(() => resolve)
      }),
    [],
  )

  function acceptSpend() {
    resolver?.(true)
    setPendingQuote(null)
    setResolver(null)
  }

  function cancelSpend() {
    resolver?.(false)
    setPendingQuote(null)
    setResolver(null)
  }

  function openBoost(nextTarget) {
    setTarget(nextTarget)
  }

  function closeBoost() {
    if (loading) return
    setTarget(null)
  }

  return {
    target,
    loading,
    setLoading,
    openBoost,
    closeBoost,
    pendingQuote,
    confirmPaid,
    acceptSpend,
    cancelSpend,
  }
}
