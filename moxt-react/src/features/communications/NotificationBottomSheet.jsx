import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiArchive,
  FiBell,
  FiCheck,
  FiExternalLink,
  FiGift,
  FiInfo,
  FiShield,
  FiStar,
  FiTag,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { LinkifiedText } from '../../components/ui/LinkifiedText'
import { formatDate } from '../transfers/transferUtils'
import {
  archiveNotification,
  markNotificationRead,
} from './communicationSlice'

export const BADGE_PALETTES = {
  brand: {
    badge: 'border-brand-500/30 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300',
    iconBg: 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200',
    dot: 'bg-brand-500',
    border: 'border-brand-500/30',
  },
  emerald: {
    badge: 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/30',
  },
  amber: {
    badge: 'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    iconBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    dot: 'bg-amber-500',
    border: 'border-amber-500/30',
  },
  rose: {
    badge: 'border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
    dot: 'bg-rose-500',
    border: 'border-rose-500/30',
  },
  violet: {
    badge: 'border-violet-500/30 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200',
    dot: 'bg-violet-500',
    border: 'border-violet-500/30',
  },
  sky: {
    badge: 'border-sky-500/30 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200',
    dot: 'bg-sky-500',
    border: 'border-sky-500/30',
  },
  slate: {
    badge: 'border-slate-500/30 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    dot: 'bg-slate-500',
    border: 'border-slate-500/30',
  },
}

export function resolveBadgeIcon(iconName) {
  switch (iconName) {
    case 'zap':
      return FiZap
    case 'star':
      return FiStar
    case 'gift':
      return FiGift
    case 'shield':
      return FiShield
    case 'tag':
      return FiTag
    case 'info':
      return FiInfo
    case 'bell':
    default:
      return FiBell
  }
}

export function NotificationBadgeIcon({ name, className = 'text-sm' }) {
  switch (name) {
    case 'zap':
      return <FiZap className={className} />
    case 'star':
      return <FiStar className={className} />
    case 'gift':
      return <FiGift className={className} />
    case 'shield':
      return <FiShield className={className} />
    case 'tag':
      return <FiTag className={className} />
    case 'info':
      return <FiInfo className={className} />
    case 'bell':
    default:
      return <FiBell className={className} />
  }
}

export function NotificationBottomSheet({ notification, open, onClose, currentUserId }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [closing, setClosing] = useState(false)

  const requestClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose?.()
    }, 220)
  }

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') {
        setClosing(true)
        setTimeout(() => {
          setClosing(false)
          onClose?.()
        }, 220)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !notification) return null

  const paletteKey = notification.badgeColor || 'brand'
  const palette = BADGE_PALETTES[paletteKey] || BADGE_PALETTES.brand
  const hasBadge = Boolean(notification.badgeText)

  const priorityLabel =
    notification.priority === 'high'
      ? 'Urgent'
      : notification.priority === 'low'
        ? 'Info'
        : 'Standard'

  const actionLabel = notification.actionLabel || 'Ouvrir'
  const hasAction = Boolean(notification.link)

  function handleAction() {
    if (!notification.read) {
      dispatch(markNotificationRead(notification.id))
    }
    requestClose()
    if (notification.link) {
      navigate(notification.link)
    }
  }

  function handleMarkRead() {
    dispatch(markNotificationRead(notification.id))
  }

  function handleArchive() {
    if (currentUserId) {
      dispatch(archiveNotification({ id: notification.id, userId: currentUserId }))
    }
    requestClose()
  }

  const imageUrl =
    notification.imageUrl ||
    notification.metadata?.imageUrl ||
    notification.metadata?.bannerUrl ||
    null

  const sheet = (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col justify-end p-0 sm:grid sm:place-items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={requestClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={notification.title || 'Notification'}
        className={`relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-[2rem] border border-b-0 border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl transition-all sm:rounded-[2rem] sm:border-b ${
          closing ? 'translate-y-full opacity-90' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Grab Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-6 py-3">
          <div className="flex items-center gap-2">
            <span className={`grid size-8 place-items-center rounded-xl ${palette.iconBg}`}>
              <NotificationBadgeIcon name={notification.badgeIcon} className="text-sm" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--app-text-muted)]">
              {priorityLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={requestClose}
            className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-[var(--app-surface-muted)] dark:text-slate-400"
            aria-label="Fermer"
          >
            <FiX className="text-base" />
          </button>
        </header>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {imageUrl ? (
            <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-slate-100 dark:bg-slate-800">
              <img
                src={imageUrl}
                alt={notification.title || 'Diffusion Moxt'}
                className="max-h-60 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          {hasBadge ? (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide">
              <span className={`size-2 rounded-full ${palette.dot}`} />
              <span className={palette.badge}>{notification.badgeText}</span>
            </div>
          ) : null}

          <h2 className="text-xl font-black leading-snug text-[var(--app-text)]">
            {notification.title}
          </h2>

          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            {notification.createdAt ? formatDate(notification.createdAt) : ''}
          </p>

          <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
            <LinkifiedText
              as="p"
              text={notification.message}
              preserveWhitespace="pre-line"
              className="text-sm leading-relaxed text-[var(--app-text)] [overflow-wrap:anywhere]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="grid gap-2 border-t border-[var(--app-border)] px-6 pt-4">
          {hasAction ? (
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center"
              icon={FiExternalLink}
              onClick={handleAction}
            >
              {actionLabel}
            </Button>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!notification.read ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 justify-center"
                icon={FiCheck}
                onClick={handleMarkRead}
              >
                Marquer comme lue
              </Button>
            ) : null}

            {currentUserId ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-center text-slate-500"
                icon={FiArchive}
                onClick={handleArchive}
              >
                Archiver
              </Button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(sheet, document.body) : sheet
}
