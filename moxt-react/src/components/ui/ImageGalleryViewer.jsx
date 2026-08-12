import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { useSwipeDownToClose } from '../../hooks/useSwipeDownToClose'

/**
 * Lecteur plein écran d’images — fond complet 82 % + dégradés latéraux 93 %,
 * image au-dessus des calques de fond.
 */
export function ImageGalleryViewer({
  open,
  onClose,
  title,
  images = [],
  activeIndex = 0,
  onSelectIndex,
  alt = '',
  countLabel,
}) {
  const { t } = useLanguage()
  const safeIndex =
    open && images.length ? ((activeIndex % images.length) + images.length) % images.length : 0
  const activeImage = open && images.length ? images[safeIndex] : ''
  const hasMultiple = open && images.length > 1
  const { imageRef, imageSwipeHandlers } = useSwipeDownToClose(onClose, open, activeImage, {
    onPrevious: hasMultiple ? () => onSelectIndex?.(safeIndex - 1) : undefined,
    onNext: hasMultiple ? () => onSelectIndex?.(safeIndex + 1) : undefined,
  })

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      if (!onSelectIndex || images.length < 2) return
      if (event.key === 'ArrowLeft') onSelectIndex(activeIndex - 1)
      if (event.key === 'ArrowRight') onSelectIndex(activeIndex + 1)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, images.length, onClose, onSelectIndex, open])

  if (!open || !images.length) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col overscroll-none touch-none"
      data-no-pull-refresh
      role="dialog"
      aria-modal="true"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/[0.82]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-1/3 bg-gradient-to-r from-black/[0.93] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-1/3 bg-gradient-to-l from-black/[0.93] to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 shrink-0">
        {hasMultiple ? (
          <div
            className="flex gap-1 p-2 sm:p-3"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
          >
            {images.map((image, index) => (
              <div key={image || index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white transition-[width] duration-300 ease-out"
                  style={{ width: index <= safeIndex ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }} />
        )}

        <div className="flex items-center gap-3 px-3 pb-2 sm:px-4">
          <div className="min-w-0 flex-1">
            {title ? <p className="truncate text-sm font-bold text-white sm:text-base">{title}</p> : null}
            {countLabel ? <p className="text-xs text-white/60">{countLabel}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('status.viewer.close')}
            className="grid size-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10"
          >
            <FiX className="text-lg" />
          </button>
        </div>
      </div>

      <div
        ref={imageRef}
        className="relative z-10 flex min-h-0 flex-1 flex-col touch-none"
        {...imageSwipeHandlers}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('status.viewer.close')}
          className="relative z-10 min-h-0 flex-1 w-full"
        />
        <div className="relative z-20 flex shrink-0 justify-center px-2">
          <img
            src={activeImage}
            alt={alt}
            className="max-h-[min(72dvh,780px)] w-full max-w-2xl object-contain"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('status.viewer.close')}
          className="relative z-10 min-h-0 flex-1 w-full"
        />

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => onSelectIndex(safeIndex - 1)}
              aria-label={t('status.viewer.previous')}
              className="pointer-events-none absolute inset-y-0 left-0 z-30 flex w-1/3 items-center justify-start pl-2 text-white/70 transition hover:text-white sm:pl-4"
            >
              <span className="pointer-events-auto inline-grid size-10 place-items-center rounded-full bg-black/[0.8] backdrop-blur-sm">
                <FiChevronLeft className="text-3xl drop-shadow" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelectIndex(safeIndex + 1)}
              aria-label={t('status.viewer.next')}
              className="pointer-events-none absolute inset-y-0 right-0 z-30 flex w-1/3 items-center justify-end pr-2 text-white/70 transition hover:text-white sm:pr-4"
            >
              <span className="pointer-events-auto inline-grid size-10 place-items-center rounded-full bg-black/[0.8] backdrop-blur-sm">
                <FiChevronRight className="text-3xl drop-shadow" />
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div
        className="relative z-10 shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      />
    </div>,
    document.body,
  )
}
