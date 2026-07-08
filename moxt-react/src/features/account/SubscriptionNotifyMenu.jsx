import { useEffect, useRef, useState } from 'react'
import { FiBell, FiBellOff, FiCheck, FiStar, FiVolumeX } from 'react-icons/fi'
import {
  SUBSCRIPTION_NOTIFY_HINTS,
  SUBSCRIPTION_NOTIFY_LABELS,
  SUBSCRIPTION_NOTIFY_PREFS,
} from '@moxt/shared/utils/subscriptionUtils.js'

const PREF_ICONS = {
  all: FiBell,
  important: FiStar,
  muted: FiVolumeX,
}

const PREF_TONES = {
  all: 'text-brand-700 bg-brand-50 dark:text-brand-200 dark:bg-brand-950/40',
  important: 'text-amber-700 bg-amber-50 dark:text-amber-200 dark:bg-amber-950/30',
  muted: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/60',
}

export function SubscriptionNotifyMenu({
  activePref = 'all',
  isSubscribed = false,
  onSelect,
  onUnsubscribe,
  trigger,
  align = 'right',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function handleSelect(pref) {
    onSelect?.(pref)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open ? (
        <div
          className={`absolute top-[calc(100%+0.5rem)] z-50 min-w-[15.5rem] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          role="menu"
          aria-label="Préférences de notification d'abonnement"
        >
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
            Notifications reçues
          </p>
          {SUBSCRIPTION_NOTIFY_PREFS.map((pref) => {
            const Icon = PREF_ICONS[pref]
            const active = isSubscribed && activePref === pref
            return (
              <button
                key={pref}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--app-surface-muted)] ${
                  active ? 'bg-[var(--app-accent-soft)]/70' : ''
                }`}
                onClick={() => handleSelect(pref)}
              >
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${PREF_TONES[pref]}`}
                >
                  <Icon className="text-sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
                    {SUBSCRIPTION_NOTIFY_LABELS[pref]}
                    {active ? <FiCheck className="text-[var(--app-accent)]" /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[var(--app-text-muted)]">
                    {SUBSCRIPTION_NOTIFY_HINTS[pref]}
                  </span>
                </span>
              </button>
            )
          })}
          {isSubscribed ? (
            <>
              <div className="my-1 h-px bg-[var(--app-border)]" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                onClick={() => {
                  onUnsubscribe?.()
                  setOpen(false)
                }}
              >
                <FiBellOff />
                Se désabonner
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
