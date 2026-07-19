import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'

/**
 * Visionneuse plein écran réutilisable (même modèle que le fil d'actualités /
 * la messagerie) : à utiliser partout où des images doivent s'ouvrir en vue
 * interne plutôt que dans un nouvel onglet.
 */
export function ImageLightbox({ open, onClose, images, index, onIndexChange, alt = '' }) {
  const { t } = useLanguage()
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const multi = images.length > 1
  const current = images[index]
  const imageAlt = alt || t('common.lightbox.title')

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
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out"
        aria-label={t('common.lightbox.close')}
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
          {t('common.lightbox.title')}
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
            aria-label={t('common.lightbox.close')}
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
                aria-label={t('common.lightbox.previous')}
              >
                <FiChevronLeft className="text-2xl" />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((currentIndex) => (currentIndex + 1) % images.length)}
                className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-2"
                aria-label={t('common.lightbox.next')}
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
