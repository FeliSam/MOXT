import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiX, FiZoomIn } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

/** Fixed-size carousel: one image at a time, prev/next when several. Click opens full preview. */
export function FeedPostImages({ images = [], alt = '' }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [index, setIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const list = Array.isArray(images) ? images.filter(Boolean) : []

  if (!list.length) return null

  const safeIndex = ((index % list.length) + list.length) % list.length
  const current = list[safeIndex]
  const multi = list.length > 1
  const imageAlt = alt || p3('news.feed.imageAlt', { index: safeIndex + 1 })

  function go(delta) {
    setIndex((currentIndex) => (currentIndex + delta + list.length) % list.length)
  }

  function openPreview() {
    setPreviewOpen(true)
  }

  return (
    <>
      <div className="relative border-y border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/40">
        <div className="relative aspect-[10/9] w-full overflow-hidden">
          <button
            type="button"
            onClick={openPreview}
            className="group relative block h-full w-full cursor-zoom-in"
            aria-label={p3('news.feed.openPreview')}
          >
            <img
              src={current}
              alt={imageAlt}
              className="h-full w-full object-cover transition duration-200 group-hover:brightness-95"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden'
              }}
            />
            <span className="pointer-events-none absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white opacity-80 transition group-hover:opacity-100">
              <FiZoomIn className="text-sm" aria-hidden />
            </span>
          </button>
          {multi ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  go(-1)
                }}
                className="absolute left-2 top-1/2 z-[1] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow transition hover:bg-black/70"
                aria-label={p3('news.feed.prevImage')}
              >
                <FiChevronLeft className="text-lg" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  go(1)
                }}
                className="absolute right-2 top-1/2 z-[1] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow transition hover:bg-black/70"
                aria-label={p3('news.feed.nextImage')}
              >
                <FiChevronRight className="text-lg" />
              </button>
              <span className="pointer-events-none absolute bottom-2 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white">
                {safeIndex + 1}/{list.length}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <FeedImagePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={list}
        index={safeIndex}
        onIndexChange={setIndex}
        alt={alt}
      />
    </>
  )
}

function FeedImagePreview({ open, onClose, images, index, onIndexChange, alt = '' }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const multi = images.length > 1
  const current = images[index]
  const imageAlt = alt || p3('news.feed.imageAlt', { index: index + 1 })

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (!multi) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onIndexChange((currentIndex) => (currentIndex - 1 + images.length) % images.length)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onIndexChange((currentIndex) => (currentIndex + 1) % images.length)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [images.length, multi, onIndexChange, open])

  if (!open || !current) return null

  const preview = (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-slate-950/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out"
        aria-label={p3('news.feed.closePreview')}
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-5xl flex-col outline-none"
      >
        <h2 id={titleId} className="sr-only">
          {p3('news.feed.previewTitle')}
        </h2>

        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          {multi ? (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tabular-nums">
              {index + 1}/{images.length}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={p3('news.feed.closePreview')}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <img
            src={current}
            alt={imageAlt}
            className="max-h-[min(80dvh,820px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            decoding="async"
          />

          {multi ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onIndexChange((currentIndex) => (currentIndex - 1 + images.length) % images.length)
                }
                className="absolute left-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-2"
                aria-label={p3('news.feed.prevImage')}
              >
                <FiChevronLeft className="text-2xl" />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((currentIndex) => (currentIndex + 1) % images.length)}
                className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-2"
                aria-label={p3('news.feed.nextImage')}
              >
                <FiChevronRight className="text-2xl" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(preview, document.body) : preview
}
