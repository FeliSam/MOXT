import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiCopy, FiShare2, FiX } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { marketplaceText } from '../marketplace/marketplaceI18n'
import { addToast } from '../ui/uiSlice'

function ShareActionRow({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)] active:scale-[0.99]"
    >
      <Icon className="text-lg text-[var(--app-text-muted)]" aria-hidden="true" />
      {children}
    </button>
  )
}

/** Bottom sheet de partage — copier le lien ou partage natif. */
export function EntityShareSheet({ open, onClose, title, url, onShared }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const mt = (key) => marketplaceText(t, key)
  const [closing, setClosing] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

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
      onClose()
      setClosing(false)
    }, 220)
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard?.writeText(shareUrl)
      onShared?.()
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopiedTitle'),
          message: p3('feed.linkCopiedBody'),
          tone: 'success',
        }),
      )
    } catch {
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopyFailed'),
          tone: 'error',
        }),
      )
    }
    requestClose()
  }

  async function shareNative() {
    if (!shareUrl) return
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'MOXT', url: shareUrl })
      } else {
        await navigator.clipboard?.writeText(shareUrl)
      }
      onShared?.()
      dispatch(
        addToast({
          title: mt('marketplace.detail.shareSuccessTitle'),
          message: mt('marketplace.detail.shareSuccessBody'),
          tone: 'success',
        }),
      )
    } catch (error) {
      if (error?.name === 'AbortError') return
      dispatch(
        addToast({
          title: mt('marketplace.detail.shareCancelledTitle'),
          message: mt('marketplace.detail.shareCancelledBody'),
          tone: 'info',
        }),
      )
    }
    requestClose()
  }

  if (!open && !closing) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] overscroll-none">
      <button
        type="button"
        aria-label={p3('videos.feed.closeMore')}
        onClick={requestClose}
        className={`absolute inset-0 bg-slate-950/55 backdrop-blur-[1px] ${
          closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out_forwards]'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mt('marketplace.detail.share')}
        className={`absolute inset-x-0 bottom-0 flex max-h-[min(70dvh,24rem)] flex-col overflow-hidden rounded-t-[1.4rem] border border-b-0 border-[var(--app-border)]/80 bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--shadow-card-lg)] backdrop-blur-xl ${
          closing ? 'drawer-leave' : 'drawer-enter'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-[var(--app-border-md)]" />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-border)]/70 px-4 pb-3 pt-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{mt('marketplace.detail.share')}</p>
            {title ? (
              <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">{title}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]"
            aria-label={p3('videos.feed.closeMore')}
          >
            <FiX />
          </button>
        </header>
        <div className="grid gap-1 px-3 py-2">
          <ShareActionRow icon={FiCopy} onClick={copyLink}>
            {t('share.copyLink')}
          </ShareActionRow>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
            <ShareActionRow icon={FiShare2} onClick={shareNative}>
              {t('share.share')}
            </ShareActionRow>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
