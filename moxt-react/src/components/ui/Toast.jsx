import { useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiBell,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { removeToast } from '../../features/ui/uiSlice'

/* ─── Configuration par tone ─────────────────────────────────────────────── */
const ERROR_TONE = {
  icon: FiAlertCircle,
  bar: 'bg-red-500',
  iconCls: 'text-red-500',
  border: 'border-red-200 dark:border-red-900/50',
  bg: 'bg-white dark:bg-slate-900',
}

const TONE_CONFIG = {
  success: {
    icon: FiCheckCircle,
    bar: 'bg-emerald-500',
    iconCls: 'text-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    bg: 'bg-white dark:bg-slate-900',
  },
  danger: ERROR_TONE,
  error: ERROR_TONE,
  warning: {
    icon: FiAlertTriangle,
    bar: 'bg-amber-400',
    iconCls: 'text-amber-500',
    border: 'border-amber-200 dark:border-amber-900/50',
    bg: 'bg-white dark:bg-slate-900',
  },
  info: {
    icon: FiInfo,
    bar: 'bg-blue-500',
    iconCls: 'text-blue-500',
    border: 'border-blue-200 dark:border-blue-900/50',
    bg: 'bg-white dark:bg-slate-900',
  },
  engagement: {
    icon: FiBell,
    bar: 'bg-brand-600',
    iconCls: 'text-brand-600',
    border: 'border-brand-200 dark:border-brand-900/50',
    bg: 'bg-white dark:bg-slate-900',
  },
}

const DEFAULT_TONE = {
  icon: FiInfo,
  bar: 'bg-brand-600',
  iconCls: 'text-brand-600',
  border: 'border-[var(--app-border)]',
  bg: 'bg-white dark:bg-slate-900',
}

/* ─── Duree affichage ────────────────────────────────────────────────────── */
const DURATION = 4500
const ENGAGEMENT_DURATION = 6000

/* ─── Item de toast ──────────────────────────────────────────────────────── */
function ToastItem({ toast }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  const config = TONE_CONFIG[toast.tone] ?? DEFAULT_TONE
  const Icon = config.icon
  const clickable = Boolean(toast.link)
  const duration = toast.engagement ? ENGAGEMENT_DURATION : DURATION

  function dismiss() {
    setLeaving(true)
    setTimeout(() => dispatch(removeToast(toast.id)), 200)
  }

  function openLink() {
    if (!toast.link) return
    dismiss()
    navigate(toast.link)
  }

  useEffect(() => {
    const t = setTimeout(dismiss, duration)
    return () => clearTimeout(t)
  }, [toast.id, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role={clickable ? 'button' : toast.tone === 'error' || toast.tone === 'danger' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' || toast.tone === 'danger' ? 'assertive' : 'polite'}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? openLink : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openLink()
              }
            }
          : undefined
      }
      className={`
        relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-[var(--shadow-float)]
        ${config.border} ${config.bg}
        ${leaving ? 'toast-exit' : 'toast-enter'}
        ${clickable ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-lg)]' : ''}
      `}
    >
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.bar} toast-progress`}
        style={{ animationDuration: `${duration}ms` }}
      />

      <div className="flex items-start gap-3 p-4">
        {toast.tone === 'success' ? (
          <span className={`success-check shrink-0 !size-8 ${config.iconCls}`} aria-hidden="true">
            <Icon className="!h-4 !w-4" strokeWidth={2.5} />
          </span>
        ) : (
          <Icon className={`mt-0.5 shrink-0 text-xl ${config.iconCls}`} aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          {toast.title ? (
            <strong className="toast-item-title block text-sm font-bold text-[var(--app-text)]">
              {toast.title}
            </strong>
          ) : null}
          {toast.message ? (
            <p
              className={`toast-item-message text-sm text-[var(--app-text-muted)] ${toast.title ? 'mt-0.5' : ''}`}
            >
              {toast.message}
            </p>
          ) : null}
          {clickable ? (
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              Appuyer pour ouvrir
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Fermer la notification"
          onClick={(event) => {
            event.stopPropagation()
            dismiss()
          }}
          className="ml-1 grid size-7 shrink-0 place-items-center rounded-lg text-[var(--app-text-faint)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
        >
          <FiX className="text-sm" />
        </button>
      </div>
    </div>
  )
}

/* ─── Viewport (zone d'affichage fixe) ───────────────────────────────────── */
export function ToastViewport() {
  const toasts = useSelector((state) => state.ui.toasts)

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[60] grid w-[calc(100vw-2rem)] max-w-sm justify-items-end gap-2.5 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
