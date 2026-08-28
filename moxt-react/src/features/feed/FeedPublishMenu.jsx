import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiEdit3,
  FiPlus,
  FiRepeat,
  FiShoppingBag,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { LuPlus } from 'react-icons/lu'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { ShareToFeedModal } from '../../components/ui/ShareToFeedModal'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { useGuestAction } from '../guest/useGuestAction'
import { StatusComposer } from '../statuses/StatusComposer'
import { useDevModuleNavAccess } from '../../hooks/useDevModuleAccess'

const PUBLISH_OPTION_MODULES = {
  video: 'videos',
  post: 'news',
  event: 'events',
  job: 'jobs',
  parcel: 'parcels',
}

const PUBLISH_OPTIONS = [
  {
    id: 'transfer',
    to: '/transfers',
    icon: FiRepeat,
    labelKey: 'feed.publish.transfer',
    hintKey: 'feed.publish.transferHint',
    accent:
      'from-teal-500/15 to-emerald-400/10 text-teal-700 dark:from-teal-500/25 dark:to-emerald-400/10 dark:text-teal-100',
  },
  {
    id: 'p2p',
    to: '/p2p/publish',
    icon: FiUsers,
    labelKey: 'feed.publish.p2p',
    hintKey: 'feed.publish.p2pHint',
    accent:
      'from-cyan-500/15 to-blue-400/10 text-cyan-700 dark:from-cyan-500/20 dark:to-blue-400/10 dark:text-cyan-100',
  },
  {
    id: 'video',
    to: '/videos/publish',
    icon: FiVideo,
    labelKey: 'feed.publish.video',
    hintKey: 'feed.publish.videoHint',
    accent:
      'from-rose-500/15 to-orange-400/10 text-rose-700 dark:from-rose-500/20 dark:to-orange-400/10 dark:text-rose-200',
  },
  {
    id: 'post',
    action: 'post',
    icon: FiEdit3,
    labelKey: 'feed.publish.post',
    hintKey: 'feed.publish.postHint',
    accent:
      'from-sky-500/15 to-cyan-400/10 text-sky-700 dark:from-sky-500/20 dark:to-cyan-400/10 dark:text-sky-200',
  },
  {
    id: 'status',
    action: 'status',
    icon: HiOutlineSparkles,
    labelKey: 'feed.publish.status',
    hintKey: 'feed.publish.statusHint',
    accent:
      'from-violet-500/15 to-fuchsia-400/10 text-violet-700 dark:from-violet-500/20 dark:to-fuchsia-400/10 dark:text-violet-200',
  },
  {
    id: 'listing',
    to: '/marketplace/publish',
    icon: FiShoppingBag,
    labelKey: 'feed.publish.listing',
    hintKey: 'feed.publish.listingHint',
    accent:
      'from-emerald-500/15 to-teal-400/10 text-emerald-700 dark:from-emerald-500/20 dark:to-teal-400/10 dark:text-emerald-200',
  },
  {
    id: 'parcel',
    to: '/parcels/publish',
    icon: FiBox,
    labelKey: 'feed.publish.parcel',
    hintKey: 'feed.publish.parcelHint',
    accent:
      'from-amber-500/15 to-yellow-400/10 text-amber-800 dark:from-amber-500/20 dark:to-yellow-400/10 dark:text-amber-200',
  },
  {
    id: 'job',
    to: '/jobs/publish',
    icon: FiBriefcase,
    labelKey: 'feed.publish.job',
    hintKey: 'feed.publish.jobHint',
    accent:
      'from-slate-400/20 to-zinc-300/10 text-slate-700 dark:from-slate-400/25 dark:to-zinc-300/10 dark:text-slate-100',
  },
  {
    id: 'event',
    to: '/events/publish',
    icon: FiCalendar,
    labelKey: 'feed.publish.event',
    hintKey: 'feed.publish.eventHint',
    accent:
      'from-indigo-500/15 to-blue-400/10 text-indigo-700 dark:from-indigo-500/20 dark:to-blue-400/10 dark:text-indigo-200',
  },
]

/**
 * Bouton + → feuille « Publier » (vidéo, post, statut, annonce, colis, event, job).
 * @param {{ variant?: 'inline' | 'fab' | 'header', className?: string }} props
 */
export function FeedPublishMenu({ variant = 'inline', className = '' }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const navigate = useNavigate()
  const { requireAccount } = useGuestAction()
  const canAccessModule = useDevModuleNavAccess()
  const publishOptions = PUBLISH_OPTIONS.filter((option) => {
    const moduleId = PUBLISH_OPTION_MODULES[option.id]
    return !moduleId || canAccessModule(moduleId)
  })
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') requestClose()
    }
    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 220)
  }

  function openMenu() {
    if (requireAccount(p3('feed.publish.guest'))) return
    setOpen(true)
  }

  function choose(option) {
    requestClose()
    window.setTimeout(() => {
      if (option.action === 'status') {
        setStatusOpen(true)
        return
      }
      if (option.action === 'post') {
        setPostOpen(true)
        return
      }
      if (option.to) navigate(option.to)
    }, 180)
  }

  const triggerClass =
    variant === 'fab'
      ? `fixed right-4 z-[calc(var(--z-nav)-1)] grid size-14 place-items-center rounded-full bg-[var(--app-accent)] text-white shadow-[0_10px_28px_rgba(15,23,42,0.28)] ring-1 ring-black/5 transition active:scale-95 bottom-[calc(var(--bottom-nav-clearance)+0.65rem)] lg:right-8 ${className}`
      : variant === 'header'
        ? `header-action-btn relative grid ${className}`
        : `grid size-9 shrink-0 place-items-center rounded-full bg-white text-black shadow-md backdrop-blur-md transition active:scale-95 ${className}`

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label={p3('feed.publish.trigger')}
        title={p3('feed.publish.trigger')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerClass}
        data-testid={
          variant === 'fab'
            ? 'feed-publish-fab'
            : variant === 'header'
              ? 'feed-publish-header'
              : 'feed-publish-menu'
        }
      >
        {variant === 'header' ? (
          <>
            <LuPlus className="header-action-icon" strokeWidth={1.48} aria-hidden />
            <span className="header-action-label" role="tooltip">
              {p3('feed.publish.trigger')}
            </span>
          </>
        ) : (
          <FiPlus className={variant === 'fab' ? 'text-2xl' : 'text-lg'} aria-hidden />
        )}
      </button>

      {open || closing
        ? createPortal(
            <div className="fixed inset-0 z-[var(--z-modal)] overscroll-none">
              <button
                type="button"
                aria-label={p3('feed.publish.close')}
                onClick={requestClose}
                className={`absolute inset-0 bg-slate-950/55 backdrop-blur-[1px] dark:bg-black/55 ${
                  closing
                    ? 'animate-[fadeOut_200ms_ease-in_forwards]'
                    : 'animate-[fadeIn_200ms_ease-out_forwards]'
                }`}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`absolute inset-x-0 bottom-0 flex max-h-[min(88dvh,40rem)] flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-[var(--app-border)]/80 bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--shadow-card-lg)] backdrop-blur-xl ${
                  closing ? 'drawer-leave' : 'drawer-enter'
                }`}
                style={{ paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom))' }}
              >
                <div className="flex shrink-0 justify-center pt-2.5">
                  <span className="h-1 w-10 rounded-full bg-[var(--app-border-md)]" />
                </div>

                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--app-border)]/70 px-5 pb-3 pt-2">
                  <div className="min-w-0">
                    <p id={titleId} className="text-[1.05rem] font-black tracking-tight text-[var(--app-text)]">
                      {p3('feed.publish.title')}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--app-text-muted)]">
                      {p3('feed.publish.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={requestClose}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
                    aria-label={p3('feed.publish.close')}
                  >
                    <FiX />
                  </button>
                </header>

                <div
                  className="scrollbar-hidden min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-2 pt-1"
                  data-navbar-ignore
                  onWheel={(event) => event.stopPropagation()}
                >
                  <ul className="grid gap-1.5" role="menu" aria-label={p3('feed.publish.title')}>
                    {publishOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => choose(option)}
                            className="group flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition hover:bg-[var(--app-surface-muted)] active:scale-[0.99]"
                          >
                            <span
                              className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-[var(--app-border)]/50 dark:ring-white/10 ${option.accent}`}
                            >
                              <Icon className="text-[1.2rem]" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-black tracking-tight text-[var(--app-text)]">
                                {p3(option.labelKey)}
                              </span>
                              <span className="mt-0.5 block truncate text-[12px] text-[var(--app-text-muted)]">
                                {p3(option.hintKey)}
                              </span>
                            </span>
                            <FiPlus
                              className="shrink-0 text-[var(--app-text-faint)] transition group-hover:text-[var(--app-text-muted)]"
                              aria-hidden
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {statusOpen ? <StatusComposer onClose={() => setStatusOpen(false)} /> : null}
      {postOpen ? (
        <ShareToFeedModal
          sourceType="free"
          sourceId={null}
          sourceData={{}}
          onClose={() => setPostOpen(false)}
        />
      ) : null}
    </>
  )
}
